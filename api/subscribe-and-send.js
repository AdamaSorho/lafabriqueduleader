export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { email, lang = 'fr' } = req.body || {}
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email' })
      return
    }

    const siteUrl = process.env.SITE_URL || req.headers.origin || ''
    const excerptUrl = `${siteUrl}/excerpt.pdf`

    const subject = lang === 'fr'
      ? 'Votre extrait — La Fabrique du Leader'
      : "Your excerpt — The Leader’s Factory"

    const html = lang === 'fr'
      ? `<p>Bonjour,</p><p>Merci pour votre intérêt. Vous pouvez télécharger l’extrait ici : <a href="${excerptUrl}">${excerptUrl}</a></p><p—>La Fabrique du Leader</p>`
      : `<p>Hello,</p><p>Thanks for your interest. Download the excerpt here: <a href="${excerptUrl}">${excerptUrl}</a></p><p—>The Leader’s Factory</p>`

    // Send email via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL || 'La Fabrique <no-reply@example.com>'
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
      })
    }

    // Subscribe to Mailchimp (if configured)
    const mcKey = process.env.MAILCHIMP_API_KEY
    const mcList = process.env.MAILCHIMP_LIST_ID
    const mcServer = process.env.MAILCHIMP_SERVER_PREFIX // e.g. us21
    if (mcKey && mcList && mcServer) {
      const auth = Buffer.from(`any:${mcKey}`).toString('base64')
      await fetch(`https://${mcServer}.api.mailchimp.com/3.0/lists/${mcList}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: email, status: 'subscribed' }),
      })
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).send(typeof err?.message === 'string' ? err.message : 'Internal Error')
  }
}

