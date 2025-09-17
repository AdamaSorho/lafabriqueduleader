// Lambda handler for AWS API Gateway HTTP API
// Sends excerpt link via Amazon SES, optionally subscribes to Mailchimp, and can store to DynamoDB (optional)

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const ses = new SESv2Client({})
const ddb = new DynamoDBClient({})
const s3 = new S3Client({})

// Note: CORS headers are handled by the Lambda Function URL configuration.
// We intentionally do not set Access-Control-* headers here to avoid duplicates.

export const handler = async (event) => {
  const method = event.requestContext?.http?.method
  const path = event.requestContext?.http?.path || ''
  const sourceIp = event.requestContext?.http?.sourceIp || event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || ''
  if (method === 'OPTIONS') {
    return { statusCode: 200, body: '' }
  }
  try {
    // Helpers
    async function verifyTurnstile(tsToken) {
      const secret = process.env.TURNSTILE_SECRET_KEY
      if (!secret) return true
      if (!tsToken) return false
      const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: tsToken, remoteip: sourceIp || '' })
      })
      const data = await resp.json().catch(() => ({}))
      return !!data.success
    }
    async function getDdbItem(table, email) {
      if (!table) return null
      const res = await ddb.send(new GetItemCommand({ TableName: table, Key: { email: { S: String(email) } } }))
      return res.Item || null
    }
    const n = (v) => Number(v?.N)
    function getLastTs(item) {
      const arr = [n(item?.ts), n(item?.verifiedAt), n(item?.updatedAt)].filter((x) => Number.isFinite(x))
      return arr.length ? Math.max(...arr) : 0
    }
    function isSuppressed(item) {
      const s = (item?.status?.S || '').toLowerCase()
      return s === 'bounced' || s === 'complained' || s === 'unsubscribed'
    }
    const WINDOW_MS = 5 * 60 * 1000
    const IP_LIMIT = 10 // max requests per IP per window

    async function rateLimitIp(ip) {
      if (!ip) return true
      const table = process.env.DDB_TABLE || process.env.DDB_PREORDERS_TABLE
      if (!table) return true
      const key = { email: { S: `ip#${ip}` } }
      const now = Date.now()
      const existing = await ddb.send(new GetItemCommand({ TableName: table, Key: key })).catch(() => ({}))
      const item = existing?.Item
      const last = item ? getLastTs(item) : 0
      if (last && (now - last) < WINDOW_MS) {
        const count = Number(item?.count?.N || '0') + 1
        if (count > IP_LIMIT) return false
        await ddb.send(new UpdateItemCommand({
          TableName: table,
          Key: key,
          UpdateExpression: 'SET count = :c, updatedAt = :t',
          ExpressionAttributeValues: { ':c': { N: String(count) }, ':t': { N: String(now) } },
        }))
        return true
      }
      // reset window
      await ddb.send(new PutItemCommand({
        TableName: table,
        Item: { email: { S: `ip#${ip}` }, count: { N: '1' }, ts: { N: String(now) } },
      }))
      return true
    }
    // Handle pre-order submissions
    if (method === 'POST' && /\/preorder$/i.test(path)) {
      const body = JSON.parse(event.body || '{}')
      const {
        email,
        name,
        phone = '',
        format,
        quantity = 1,
        country = '',
        notes = '',
        lang = 'fr',
        tsToken = '',
      } = body
      if (!(await verifyTurnstile(tsToken))) {
        return { statusCode: 400, body: 'Bot verification failed' }
      }
      if (!(await rateLimitIp(sourceIp))) {
        return { statusCode: 429, body: 'Too many requests' }
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { statusCode: 400, body: 'Invalid email' }
      }
      if (!name || String(name).trim().length < 2) {
        return { statusCode: 400, body: 'Invalid name' }
      }
      const fmt = String(format || '').toLowerCase()
      if (!['print', 'digital'].includes(fmt)) {
        return { statusCode: 400, body: 'Invalid format' }
      }
      const qty = Number(quantity) || 1

      // Rate limit and suppression checks
      const preTable = process.env.DDB_PREORDERS_TABLE || process.env.DDB_TABLE
      const signupTable = process.env.DDB_TABLE
      const priorSignup = signupTable ? await getDdbItem(signupTable, email) : null
      if (priorSignup && isSuppressed(priorSignup)) {
        return { statusCode: 400, body: 'Address suppressed' }
      }
      if (preTable) {
        const prior = await getDdbItem(preTable, email)
        const last = prior ? getLastTs(prior) : 0
        if (last && (Date.now() - last) < WINDOW_MS) {
          return { statusCode: 429, body: 'Too many requests' }
        }
      }

      // Email the team
      const fromEmail = process.env.FROM_EMAIL
      const toEmail = process.env.PREORDER_TO_EMAIL || process.env.FROM_EMAIL
      if (!fromEmail || !toEmail) throw new Error('FROM_EMAIL (and optionally PREORDER_TO_EMAIL) must be set')

      const subject = lang === 'fr' ? 'Nouvelle précommande — La Fabrique du Leader' : 'New pre-order — The Leader’s Inner Forge'
      const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      const html = `
        <h3>${esc(subject)}</h3>
        <p><strong>Nom</strong>: ${esc(name)}</p>
        <p><strong>Email</strong>: ${esc(email)}</p>
        ${phone ? `<p><strong>Téléphone</strong>: ${esc(phone)}</p>` : ''}
        <p><strong>Format</strong>: ${fmt === 'print' ? (lang === 'fr' ? 'Broché (papier)' : 'Print') : (lang === 'fr' ? 'Numérique' : 'Digital')}</p>
        <p><strong>Quantité</strong>: ${qty}</p>
        ${country ? `<p><strong>Pays</strong>: ${esc(country)}</p>` : ''}
        ${notes ? `<p><strong>Notes</strong>: ${esc(notes)}</p>` : ''}
        <p><strong>Langue</strong>: ${esc(lang)}</p>
      `

      const params = {
        FromEmailAddress: fromEmail,
        Destination: { ToAddresses: [toEmail] },
        ReplyToAddresses: [email],
        Content: { Simple: { Subject: { Data: subject }, Body: { Html: { Data: html } } } },
      }
      const configSet = process.env.SES_CONFIG_SET
      if (configSet) params.ConfigurationSetName = configSet
      await ses.send(new SendEmailCommand(params))

      // Store in DynamoDB (optional). Prefer a dedicated preorders table when available.
      const ddbTable = process.env.DDB_PREORDERS_TABLE || process.env.DDB_TABLE
      if (ddbTable) {
        const item = {
          email: { S: String(email) },
          name: { S: String(name) },
          lang: { S: String(lang) },
          ts: { N: String(Date.now()) },
          status: { S: 'preorder' },
          source: { S: 'preorder' },
          format: { S: fmt },
          quantity: { N: String(qty) },
        }
        if (phone) item.phone = { S: String(phone) }
        if (country) item.country = { S: String(country) }
        if (notes) item.notes = { S: String(notes) }
        await ddb.send(new PutItemCommand({ TableName: ddbTable, Item: item }))
      }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }

    if (method === 'POST') {
      const { email, lang = 'fr', tsToken = '' } = JSON.parse(event.body || '{}')
      if (!(await verifyTurnstile(tsToken))) {
        return { statusCode: 400, body: 'Bot verification failed' }
      }
      if (!(await rateLimitIp(sourceIp))) {
        return { statusCode: 429, body: 'Too many requests' }
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { statusCode: 400, body: 'Invalid email' }
      }
      const table = process.env.DDB_TABLE
      if (table) {
        const prior = await getDdbItem(table, email)
        if (prior && isSuppressed(prior)) {
          return { statusCode: 400, body: 'Address suppressed' }
        }
        const last = prior ? getLastTs(prior) : 0
        if (last && (Date.now() - last) < WINDOW_MS) {
          return { statusCode: 429, body: 'Too many requests' }
        }
      }

      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      const sig = crypto.createHmac('sha256', secret).update(email).digest('hex')
      const verifyPage = `${siteUrl}/download.html?e=${encodeURIComponent(email)}&sig=${sig}&lang=${encodeURIComponent(lang)}`

      const subject = lang === 'fr' ? 'Votre extrait — La Fabrique du Leader' : "Your excerpt — The Leader’s Inner Forge"
      const unsubUrl = `${siteUrl}/unsubscribe?e=${encodeURIComponent(email)}&sig=${sig}&lang=${encodeURIComponent(lang)}`
      const oneClickUrl = `${siteUrl}/one-click-unsubscribe?e=${encodeURIComponent(email)}&sig=${sig}&lang=${encodeURIComponent(lang)}`
      const companyNameFr = 'Zonzerigué Leadership International'
      const companyNameEn = 'Zonzerigué Leadership International'
      const addressFr = 'ANGRE, 8E TRANCHE EXTENSION SUD EST LOT 69-71 Abidjan; NA 001'
      const addressEn = 'ANGRE, 8E TRANCHE EXTENSION SUD EST LOT 69-71 Abidjan; NA 001'
      const privacyLink = lang === 'fr' ? `${siteUrl}/privacy.html` : `${siteUrl}/privacy-en.html`
      const termsLink = lang === 'fr' ? `${siteUrl}/terms.html` : `${siteUrl}/terms-en.html`
      const footerText = lang === 'fr'
        ? `\n\n— ${companyNameFr}\n${addressFr}\nConfidentialité: ${privacyLink} | Mentions légales: ${termsLink}`
        : `\n\n— ${companyNameEn}\n${addressEn}\nPrivacy: ${privacyLink} | Legal: ${termsLink}`
      const text = lang === 'fr'
        ? `Bonjour,\n\nMerci pour votre intérêt. Téléchargez l’extrait ici : ${verifyPage}\n\nSi vous ne souhaitez plus recevoir d’emails liés au livre, désabonnez-vous ici : ${unsubUrl}${footerText}\n`
        : `Hello,\n\nThanks for your interest. Download the excerpt here: ${verifyPage}\n\nIf you no longer wish to receive book-related emails, unsubscribe here: ${unsubUrl}${footerText}\n`
      const htmlFooter = lang === 'fr'
        ? `<p style="color:#6b7280;font-size:12px;margin-top:24px">${companyNameFr} — ${addressFr}<br/>Confidentialité: <a href="${privacyLink}">voir la politique</a> · Mentions légales: <a href="${termsLink}">voir</a></p>`
        : `<p style="color:#6b7280;font-size:12px;margin-top:24px">${companyNameEn} — ${addressEn}<br/>Privacy: <a href="${privacyLink}">view policy</a> · Legal: <a href="${termsLink}">view</a></p>`
      const html = lang === 'fr'
        ? `<p>Bonjour,</p>
           <p>Merci pour votre intérêt. Cliquez ici pour télécharger l’extrait : <a href="${verifyPage}">${verifyPage}</a></p>
           <p style="color:#6b7280;font-size:12px;margin-top:24px">Si vous ne souhaitez plus recevoir d’emails liés au livre, vous pouvez vous désabonner ici : <a href="${unsubUrl}">se désabonner</a>.</p>
           <p>— La Fabrique du Leader</p>${htmlFooter}`
        : `<p>Hello,</p>
           <p>Thanks for your interest. Click here to download the excerpt: <a href="${verifyPage}">${verifyPage}</a></p>
           <p style="color:#6b7280;font-size:12px;margin-top:24px">If you no longer wish to receive book‑related emails, you can unsubscribe here: <a href="${unsubUrl}">unsubscribe</a>.</p>
           <p>— The Leader’s Inner Forge</p>${htmlFooter}`

      // Send via SES (Raw to include List-Unsubscribe headers and multipart/alternative)
      const fromEmail = process.env.FROM_EMAIL
      if (!fromEmail) throw new Error('FROM_EMAIL not set')
      const to = email
      const boundary = 'b-' + crypto.randomUUID()
      const mime = [
        `From: ${fromEmail}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        `List-Unsubscribe: <${unsubUrl}>`,
        `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        text,
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        html,
        `--${boundary}--`,
        '',
      ].join('\r\n')
      const params = {
        Destination: { ToAddresses: [to] },
        Content: { Raw: { Data: new TextEncoder().encode(mime) } },
        FromEmailAddress: fromEmail,
      }
      const configSet = process.env.SES_CONFIG_SET
      if (configSet) params.ConfigurationSetName = configSet
      await ses.send(new SendEmailCommand(params))

      // Store in DynamoDB with pending status
      if (process.env.DDB_TABLE) {
        await ddb.send(new PutItemCommand({
          TableName: process.env.DDB_TABLE,
          Item: {
            email: { S: email },
            lang: { S: lang },
            ts: { N: String(Date.now()) },
            status: { S: 'pending' },
            source: { S: 'excerpt' },
          },
        }))
      }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }

    // GET /verify-excerpt?e=...&sig=...
    if (method === 'GET' && path.endsWith('/verify-excerpt')) {
      const params = event.queryStringParameters || {}
      const email = params.e || params.email
      const sig = params.sig
      const lang = (params.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr'
      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!email || !sig) {
        return { statusCode: 400, body: 'Missing parameters' }
      }
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex')
      if (sig !== expected) {
        return { statusCode: 400, body: 'Invalid signature' }
      }
      if (process.env.DDB_TABLE) {
        await ddb.send(new UpdateItemCommand({
          TableName: process.env.DDB_TABLE,
          Key: { email: { S: email } },
          UpdateExpression: 'SET #s = :v, verifiedAt = :t, #src = if_not_exists(#src, :src)',
          ExpressionAttributeNames: { '#s': 'status', '#src': 'source' },
          ExpressionAttributeValues: {
            ':v': { S: 'verified' },
            ':t': { N: String(Date.now()) },
            ':src': { S: 'excerpt' },
          },
        }))
      }
      // Fetch from S3 and return inline
      const bucket = process.env.EXCERPT_S3_BUCKET
      const key = lang === 'en' ? (process.env.EXCERPT_EN_S3_KEY || 'private/excerpts/excerpt-en.pdf') : (process.env.EXCERPT_FR_S3_KEY || 'private/excerpts/excerpt-fr.pdf')
      if (!bucket) return { statusCode: 500, body: 'Excerpt bucket not configured' }
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const stream = obj.Body
      const chunks = []
      for await (const chunk of stream) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="excerpt-' + lang + '.pdf"',
          'Cache-Control': 'no-store'
        },
        isBase64Encoded: true,
        body: buffer.toString('base64')
      }
    }

    // Unsubscribe by link
    if ((method === 'GET' || method === 'POST') && path.endsWith('/unsubscribe')) {
      const qs = event.queryStringParameters || {}
      let email = qs.e || qs.email
      let sig = qs.sig
      const lang = (qs.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr'
      if (method === 'POST' && (!email || !sig)) {
        // Try form-encoded body
        try {
          const ct = (event.headers?.['content-type'] || event.headers?.['Content-Type'] || '').toLowerCase()
          if (ct.includes('application/x-www-form-urlencoded')) {
            const u = new URLSearchParams(event.body || '')
            email = email || u.get('e') || u.get('email') || ''
            sig = sig || u.get('sig') || ''
          }
        } catch {}
      }
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      if (!email || !sig) return { statusCode: 400, body: 'Missing parameters' }
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex')
      if (sig !== expected) return { statusCode: 400, body: 'Invalid signature' }
      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
      if (process.env.DDB_TABLE) {
        await ddb.send(new UpdateItemCommand({
          TableName: process.env.DDB_TABLE,
          Key: { email: { S: email } },
          UpdateExpression: 'SET #s = :s, unsubscribedAt = :t',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': { S: 'unsubscribed' }, ':t': { N: String(Date.now()) } },
        }))
      }
      const page = lang === 'en' ? '/unsubscribed-en.html' : '/unsubscribed.html'
      return { statusCode: 302, headers: { Location: `${siteUrl}${page}` }, body: '' }
    }

    // One-Click Unsubscribe (RFC 8058) — same as above
    if ((method === 'GET' || method === 'POST') && path.endsWith('/one-click-unsubscribe')) {
      const qs = event.queryStringParameters || {}
      let email = qs.e || qs.email
      let sig = qs.sig
      if (method === 'POST' && (!email || !sig)) {
        try {
          const ct = (event.headers?.['content-type'] || event.headers?.['Content-Type'] || '').toLowerCase()
          if (ct.includes('application/x-www-form-urlencoded')) {
            const u = new URLSearchParams(event.body || '')
            email = email || u.get('e') || u.get('email') || ''
            sig = sig || u.get('sig') || ''
          }
        } catch {}
      }
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      if (!email || !sig) return { statusCode: 400, body: 'Missing parameters' }
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex')
      if (sig !== expected) return { statusCode: 400, body: 'Invalid signature' }
      if (process.env.DDB_TABLE) {
        await ddb.send(new UpdateItemCommand({
          TableName: process.env.DDB_TABLE,
          Key: { email: { S: email } },
          UpdateExpression: 'SET #s = :s, unsubscribedAt = :t',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': { S: 'unsubscribed' }, ':t': { N: String(Date.now()) } },
        }))
      }
      return { statusCode: 200, body: 'Unsubscribed' }
    }

    return { statusCode: 405, body: 'Method not allowed' }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: typeof err?.message === 'string' ? err.message : 'Internal Error' }
  }
}
