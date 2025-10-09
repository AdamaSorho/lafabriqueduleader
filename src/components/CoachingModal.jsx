import { useState } from 'react'

export default function CoachingModal({ open, onClose, lang }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState('')
  const [availability, setAvailability] = useState('')
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
    if (String(background).trim().length < 10) {
      setStatus('error')
      setFeedback(t('Merci de décrire brièvement votre parcours.', 'Please describe your background briefly.'))
      return
    }
    if (String(goals).trim().length < 10) {
      setStatus('error')
      setFeedback(t('Merci de préciser vos objectifs.', 'Please outline your goals.'))
      return
    }
    if (String(availability).trim().length < 4) {
      setStatus('error')
      setFeedback(t('Merci d’indiquer vos disponibilités souhaitées.', 'Please include your desired timing or availability.'))
      return
    }
    const tokenEl = document.querySelector('.ts-coaching input[name="cf-turnstile-response"]')
    const tsToken = tokenEl ? tokenEl.value : ''
    setStatus('loading')
    try {
      const base = import.meta.env?.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) {
        setStatus('error')
        setFeedback(t('Service indisponible pour le moment.', 'Service unavailable right now.'))
        return
      }
      const url = `${base.replace(/\/$/, '')}/coaching`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, background, goals, availability, lang, tsToken }),
      })
      if (res.ok) {
        setStatus('success')
        setFeedback(t('Merci ! Nous vous recontactons sous peu.', 'Thank you! We’ll be in touch shortly.'))
        setName('')
        setEmail('')
        setBackground('')
        setGoals('')
        setAvailability('')
      } else {
        const txt = await res.text().catch(() => '')
        setStatus('error')
        setFeedback(
          t(
            'Impossible d’envoyer votre demande. Réessayez ou écrivez-nous à contact@zonzerigueleadership.com.',
            'Unable to send your request. Please try again or email contact@zonzerigueleadership.com.'
          ) + (txt ? ` ${txt}` : '')
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
              {t('Demander un accompagnement', 'Apply for Coaching')}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {t(
                'Dites-nous ce que vous recherchez. Nous vous écrirons pour organiser un premier échange.',
                'Tell us what you’re looking for and we’ll reach out to schedule an introductory call.'
              )}
            </p>
          </div>
          <button className="text-gray-400 transition hover:text-gray-600" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="mt-4 grid gap-3 ts-coaching" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label htmlFor="coaching-name" className="text-xs font-medium text-gray-700">
              {t('Nom', 'Name')}
            </label>
            <input
              id="coaching-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('Votre nom', 'Your name')}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="coaching-email" className="text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              id="coaching-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="coaching-background" className="text-xs font-medium text-gray-700">
              {t('Parcours / contexte', 'Background / context')}
            </label>
            <textarea
              id="coaching-background"
              required
              rows={3}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t(
                'Fonction, responsabilités, expérience, etc.',
                'Role, responsibilities, recent journey…'
              )}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="coaching-goals" className="text-xs font-medium text-gray-700">
              {t('Objectifs', 'Goals')}
            </label>
            <textarea
              id="coaching-goals"
              required
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t(
                'Ce que vous souhaitez transformer ou développer.',
                'What you want to transform or strengthen.'
              )}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="coaching-availability" className="text-xs font-medium text-gray-700">
              {t('Disponibilités / horizon', 'Availability / timing')}
            </label>
            <input
              id="coaching-availability"
              type="text"
              required
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
              placeholder={t('ex : dès septembre 2025, 3 mois', 'e.g. starting September 2025, 3-month journey')}
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
            {t('Réponse sous 3 jours ouvrés.', 'We’ll respond within three business days.')}
          </div>
        </form>
      </div>
    </div>
  )
}
