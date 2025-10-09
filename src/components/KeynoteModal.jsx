import { useState } from 'react'

export default function KeynoteModal({ open, onClose, lang }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  if (!open) return null

  const t = (fr, en) => (lang === 'fr' ? fr : en)

  const onSubmit = async (e) => {
    e.preventDefault()
    setFeedback('')
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (String(name).trim().length < 2) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer votre nom.', 'Please share your name.'))
      return
    }
    if (!okEmail) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer un email valide.', 'Please provide a valid email.'))
      return
    }
    if (String(organization).trim().length < 2) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer votre organisation.', 'Please include your organization.'))
      return
    }
    if (String(eventType).trim().length < 2) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer le type d’événement.', 'Please include the event type.'))
      return
    }
    if (String(eventDate).trim().length < 2) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer la date ou la période souhaitée.', 'Please include the desired date or timing.'))
      return
    }
    if (String(message).trim().length < 10) {
      setStatus('error')
      setFeedback(t('Merci de préciser vos attentes en quelques lignes.', 'Please share a short overview of your expectations.'))
      return
    }
    const tokenEl = document.querySelector('.ts-keynote input[name="cf-turnstile-response"]')
    const tsToken = tokenEl ? tokenEl.value : ''
    setStatus('loading')
    try {
      const base = import.meta.env?.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) {
        setStatus('error')
        setFeedback(t('Service indisponible pour le moment.', 'Service unavailable at the moment.'))
        return
      }
      const url = `${base.replace(/\/$/, '')}/keynote`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          organization,
          eventType,
          eventDate,
          message,
          lang,
          tsToken,
        }),
      })
      if (res.ok) {
        setStatus('success')
        setFeedback(t('Merci ! Nous vous recontactons sous peu.', 'Thank you! We’ll be in touch shortly.'))
        setName('')
        setEmail('')
        setOrganization('')
        setEventType('')
        setEventDate('')
        setMessage('')
      } else {
        const text = await res.text().catch(() => '')
        setStatus('error')
        setFeedback(
          t(
            'Impossible d’envoyer votre demande. Réessayez ou écrivez-nous à contact@zonzerigueleadership.com.',
            'Unable to send your request. Please try again or email contact@zonzerigueleadership.com.'
          ) + (text ? ` ${text}` : '')
        )
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setFeedback(t('Connexion interrompue. Merci de réessayer.', 'Network error. Please try again.'))
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('Inviter Zonzerigue pour une conférence', 'Invite Zonzerigue for a Keynote')}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {t(
                'Partagez quelques détails pour que nous préparions une proposition alignée avec votre événement.',
                'Share a few details so we can follow up with a tailored proposal.'
              )}
            </p>
          </div>
          <button className="text-gray-400 transition hover:text-gray-600" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="mt-4 grid gap-3 ts-keynote" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label htmlFor="keynote-name" className="text-xs font-medium text-gray-700">
              {t('Nom', 'Name')}
            </label>
            <input
              id="keynote-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('Votre nom', 'Your name')}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="keynote-email" className="text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              id="keynote-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="keynote-organization" className="text-xs font-medium text-gray-700">
              {t('Organisation', 'Organization')}
            </label>
            <input
              id="keynote-organization"
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('Votre organisation', 'Your organization')}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="keynote-event-type" className="text-xs font-medium text-gray-700">
              {t('Type d’événement', 'Event type')}
            </label>
            <input
              id="keynote-event-type"
              type="text"
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('Conférence, séminaire…', 'Keynote, summit, retreat…')}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="keynote-event-date" className="text-xs font-medium text-gray-700">
              {t('Date / période souhaitée', 'Desired date or timeframe')}
            </label>
            <input
              id="keynote-event-date"
              type="text"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('ex : 15 mai 2025 ou Q3 2025', 'e.g. 15 May 2025 or Q3 2025')}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="keynote-message" className="text-xs font-medium text-gray-700">
              {t('Votre message', 'Message')}
            </label>
            <textarea
              id="keynote-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t(
                'Précisez le public, les attentes et tout contexte utile.',
                'Tell us about the audience, goals, and any useful context.'
              )}
            />
          </div>
          <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}></div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
          >
            {status === 'loading' ? t('Envoi…', 'Sending…') : t('Envoyer la demande', 'Submit request')}
          </button>
          {feedback && (
            <div className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{feedback}</div>
          )}
          <div className="text-[11px] text-gray-500">
            {t(
              'Nous reviendrons vers vous sous 2 à 3 jours ouvrés.',
              'We’ll follow up within two to three business days.'
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
