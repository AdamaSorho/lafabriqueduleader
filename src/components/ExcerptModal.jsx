import { useState } from 'react'

export default function ExcerptModal({ open, onClose, lang }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  if (!open) return null
  const t = (fr, en) => (lang === 'fr' ? fr : en)
  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) { setMessage(t('Merci d’entrer un email valide.', 'Please enter a valid email.')); setStatus('error'); return }
    setStatus('loading')
    try {
      const tokenEl = document.querySelector('.ts-excerpt input[name="cf-turnstile-response"]')
      const tsToken = tokenEl ? tokenEl.value : ''
      const base = import.meta.env && import.meta.env.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) { setStatus('error'); setMessage(t('Configuration manquante: VITE_API_BASE n’est pas défini.', 'Missing configuration: VITE_API_BASE is not set.')); return }
      const url = `${base.replace(/\/$/, '')}/subscribe-and-send`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, lang, tsToken }) })
      if (res.ok) {
        setStatus('success')
        setMessage(t('Merci ! Consultez votre boîte mail pour le lien de téléchargement.', 'Thank you! Check your inbox for the download link.'))
        setEmail('')
      } else {
        const txt = await res.text().catch(() => '')
        setStatus('error')
        setMessage(t(`Une erreur est survenue. Réessayez ou écrivez-nous: contact@lafabriqueduleader.com. ${txt}`, `Something went wrong. Try again or email us: contact@lafabriqueduleader.com. ${txt}`))
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
        <p className="mt-2 text-sm text-gray-600">{t('Entrez votre email pour recevoir le lien de téléchargement. Nous pourrons aussi vous écrire pour des nouvelles liées au livre (désinscription possible à tout moment).', 'Enter your email to receive the download link. We may also email you book-related updates (unsubscribe anytime).')}</p>
        <form className="mt-4 grid gap-3 ts-excerpt" onSubmit={onSubmit}>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={t('vous@exemple.com','you@example.com')} required className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" />
          <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}></div>
          <button type="submit" disabled={status==='loading'} className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60">{status==='loading' ? t('Envoi…','Sending…') : t('Envoyer le lien','Send the link')}</button>
          {message && (<div className={`text-xs ${status==='error'?'text-red-600':'text-emerald-600'}`}>{message}</div>)}
          <div className="text-[11px] text-gray-500">{t('En soumettant, vous acceptez de recevoir des emails de notre part. Vos données ne seront pas partagées. Désinscription à tout moment.','By submitting, you agree to receive emails from us. We do not share your data. Unsubscribe anytime.')}</div>
        </form>
      </div>
    </div>
  )
}

