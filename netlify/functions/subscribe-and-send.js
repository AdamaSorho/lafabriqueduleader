export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }
  try {
    const { email, lang = 'fr' } = JSON.parse(event.body || '{}')
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { statusCode: 400, body: 'Invalid email' }
    }

    const origin = event.headers.origin || process.env.SITE_URL || ''
    const excerptUrl = `${origin}/excerpt.pdf`
    const subject = lang === 'fr'
      ? 'Votre extrait — La Fabrique du Leader'
      : "Your excerpt — The Leader’s Factory"
    const html = lang === 'fr'
      ? `<p>Bonjour,</p><p>Merci pour votre intérêt. Vous pouvez télécharger l’extrait ici : <a href="${excerptUrl}">${excerptUrl}</a></p><p—>La Fabrique du Leader</p>`
      : `<p>Hello,</p><p>Thanks for your interest. Download the excerpt here: <a href="${excerptUrl}">${excerptUrl}</a></p><p—>The Leader’s Factory</p>`

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL || 'La Fabrique <no-reply@example.com>'
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, html })
      })
    }

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

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: typeof err?.message === 'string' ? err.message : 'Internal Error' }
  }
}

