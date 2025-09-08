// Lambda handler for AWS API Gateway HTTP API
// Sends excerpt link via Amazon SES, optionally subscribes to Mailchimp, and can store to DynamoDB (optional)

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import crypto from 'crypto'

const ses = new SESv2Client({})
const ddb = new DynamoDBClient({})

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method
  const path = event.requestContext?.http?.path || ''
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }
  try {
    if (method === 'POST') {
      const { email, lang = 'fr' } = JSON.parse(event.body || '{}')
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { statusCode: 400, headers: corsHeaders, body: 'Invalid email' }
      }

      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      const sig = crypto.createHmac('sha256', secret).update(email).digest('hex')
      const verifyPage = `${siteUrl}/download.html?e=${encodeURIComponent(email)}&sig=${sig}`

      const subject = lang === 'fr' ? 'Votre extrait — La Fabrique du Leader' : "Your excerpt — The Leader’s Inner Forge"
      const html = lang === 'fr'
        ? `<p>Bonjour,</p><p>Merci pour votre intérêt. Cliquez ici pour télécharger l’extrait : <a href="${verifyPage}">${verifyPage}</a></p><p>— La Fabrique du Leader</p>`
        : `<p>Hello,</p><p>Thanks for your interest. Click here to download the excerpt: <a href="${verifyPage}">${verifyPage}</a></p><p>— The Leader’s Inner Forge</p>`

      // Send via SES
      const fromEmail = process.env.FROM_EMAIL
      if (!fromEmail) throw new Error('FROM_EMAIL not set')
      await ses.send(new SendEmailCommand({
        FromEmailAddress: fromEmail,
        Destination: { ToAddresses: [email] },
        Content: { Simple: { Subject: { Data: subject }, Body: { Html: { Data: html } } } },
      }))

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

      // Optional: subscribe to Mailchimp
      const mcKey = process.env.MAILCHIMP_API_KEY
      const mcList = process.env.MAILCHIMP_LIST_ID
      const mcServer = process.env.MAILCHIMP_SERVER_PREFIX
      if (mcKey && mcList && mcServer) {
        const auth = Buffer.from(`any:${mcKey}`).toString('base64')
        await fetch(`https://${mcServer}.api.mailchimp.com/3.0/lists/${mcList}/members`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_address: email, status: 'subscribed' })
        })
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) }
    }

    // GET /verify-excerpt?e=...&sig=...
    if (method === 'GET' && path.endsWith('/verify-excerpt')) {
      const params = event.queryStringParameters || {}
      const email = params.e || params.email
      const sig = params.sig
      const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
      const secret = process.env.LINK_SIGNING_SECRET || ''
      if (!email || !sig) {
        return { statusCode: 400, headers: corsHeaders, body: 'Missing parameters' }
      }
      if (!secret) throw new Error('LINK_SIGNING_SECRET not set')
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex')
      if (sig !== expected) {
        return { statusCode: 400, headers: corsHeaders, body: 'Invalid signature' }
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
      return {
        statusCode: 302,
        headers: { ...corsHeaders, Location: `${siteUrl}/excerpt.pdf` },
        body: '',
      }
    }

    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, headers: corsHeaders, body: typeof err?.message === 'string' ? err.message : 'Internal Error' }
  }
}
