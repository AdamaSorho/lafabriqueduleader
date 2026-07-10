import { useState } from 'react'
import { trackEvent } from '../utils/tracking'
import RequiredMark from './RequiredMark'

export default function ExcerptModal({ open, onClose, lang }) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  if (!open) return null
  const t = (fr, en) => (lang === 'fr' ? fr : en)
  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (String(firstName).trim().length < 2) {
      setMessage(t('Merci d’indiquer votre prénom.', 'Please enter your first name.'))
      setStatus('error')
      return
    }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) { setMessage(t('Merci d’entrer un email valide.', 'Please enter a valid email.')); setStatus('error'); return }
    if (!consent) {
      setMessage(t('Merci de confirmer votre consentement.', 'Please confirm your consent.'))
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const tokenEl = document.querySelector('.ts-excerpt input[name="cf-turnstile-response"]')
      const tsToken = tokenEl ? tokenEl.value : ''
      const base = import.meta.env && import.meta.env.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) { setStatus('error'); setMessage(t('Configuration manquante: VITE_API_BASE n’est pas défini.', 'Missing configuration: VITE_API_BASE is not set.')); return }
      const url = `${base.replace(/\/$/, '')}/subscribe-and-send`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, email, whatsapp, consent, lang, tsToken }) })
      if (res.ok) {
        setStatus('success')
        setMessage(t('Merci ! Consultez votre boîte mail pour le lien de téléchargement.', 'Thank you! Check your inbox for the download link.'))
        trackEvent('excerpt_form_submit', {
          has_whatsapp: Boolean(whatsapp),
          source: 'excerpt_modal',
        })
        setFirstName('')
        setEmail('')
        setWhatsapp('')
        setConsent(false)
        window.setTimeout(() => {
          onClose?.()
          const target = document.querySelector('#commander')
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 1200)
      } else {
        const txt = await res.text().catch(() => '')
        setStatus('error')
        setMessage(t(`Une erreur est survenue. Réessayez ou écrivez-nous: contact@zonzerigueleadership.com. ${txt}`, `Something went wrong. Try again or email us: contact@zonzerigueleadership.com. ${txt}`))
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage(t('Réseau indisponible. Réessayez plus tard ou contactez-nous.', 'Network unavailable. Please try later or contact us.'))
    }
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('Télécharger un extrait', 'Download an excerpt')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <p className="mt-2 text-sm text-gray-600">{t('Recevez l’extrait gratuit et les informations utiles liées au livre. Après l’envoi, vous pourrez choisir une option de commande.', 'Receive the free excerpt and useful book-related updates. After submission, you can choose an order option.')}</p>
        <form className="mt-4 grid gap-3 ts-excerpt" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label htmlFor="excerpt-first-name" className="text-xs font-medium text-gray-700">
              {t('Prénom', 'First name')}<RequiredMark />
            </label>
            <input id="excerpt-first-name" type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder={t('Votre prénom','Your first name')} required className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" />
          </div>
          <div className="grid gap-1">
            <label htmlFor="excerpt-email" className="text-xs font-medium text-gray-700">
              Email<RequiredMark />
            </label>
            <input id="excerpt-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={t('vous@exemple.com','you@example.com')} required className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" />
          </div>
          <div className="grid gap-1">
            <label htmlFor="excerpt-whatsapp" className="text-xs font-medium text-gray-700">
              {t('WhatsApp (optionnel)', 'WhatsApp (optional)')}
            </label>
            <input id="excerpt-whatsapp" type="tel" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" />
          </div>
          <label className="flex items-start gap-2 text-xs leading-5 text-gray-600">
            <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} required className="mt-1 h-4 w-4 rounded border-black/20" />
            <span>{t('J’accepte de recevoir l’extrait et des informations liées au livre. Désinscription possible à tout moment.', 'I agree to receive the excerpt and book-related information. I can unsubscribe at any time.')}<RequiredMark /></span>
          </label>
          <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}></div>
          <button type="submit" disabled={status==='loading'} className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60">{status==='loading' ? t('Envoi…','Sending…') : t('Envoyer le lien','Send the link')}</button>
          {message && (<div className={`text-xs ${status==='error'?'text-red-600':'text-emerald-600'}`}>{message}</div>)}
          <div className="text-[11px] text-gray-500">{t('En soumettant, vous acceptez de recevoir des emails de notre part. Vos données ne seront pas partagées. Désinscription à tout moment.','By submitting, you agree to receive emails from us. We do not share your data. Unsubscribe anytime.')}</div>
        </form>
      </div>
    </div>
  )
}
