// CommonJS Lambda handler using AWS SDK v2 (bundling-free)
const AWS = require('aws-sdk')

const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION })
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION })

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

exports.handler = async (event) => {
  if (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }
  if (!event.requestContext || !event.requestContext.http || event.requestContext.http.method !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' }
  }
  try {
    const { email, lang = 'fr' } = JSON.parse(event.body || '{}')
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { statusCode: 400, headers: corsHeaders, body: 'Invalid email' }
    }

    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '')
    const excerptUrl = `${siteUrl}/excerpt.pdf`
    const subject = lang === 'fr' ? 'Votre extrait — La Fabrique du Leader' : "Your excerpt — The Leader’s Factory"
    const html = lang === 'fr'
      ? `<p>Bonjour,</p><p>Merci pour votre intérêt. Vous pouvez télécharger l’extrait ici : <a href="${excerptUrl}">${excerptUrl}</a></p><p>— La Fabrique du Leader</p>`
      : `<p>Hello,</p><p>Thanks for your interest. Download the excerpt here: <a href="${excerptUrl}">${excerptUrl}</a></p><p>— The Leader’s Factory</p>`

    const fromEmail = process.env.FROM_EMAIL
    if (!fromEmail) throw new Error('FROM_EMAIL not set')

    await ses.sendEmail({
      Source: fromEmail,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    }).promise()

    if (process.env.DDB_TABLE) {
      await ddb.putItem({
        TableName: process.env.DDB_TABLE,
        Item: {
          email: { S: email },
          lang: { S: lang },
          ts: { N: String(Date.now()) },
        },
      }).promise()
    }

    // Optional Mailchimp subscription
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
  } catch (err) {
    console.error(err)
    return { statusCode: 500, headers: corsHeaders, body: typeof err?.message === 'string' ? err.message : 'Internal Error' }
  }
}

