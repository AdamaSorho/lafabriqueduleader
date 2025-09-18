import { useState } from 'react'

export default function PreorderModal({ open, onClose, lang }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [format, setFormat] = useState('print')
  const [quantity, setQuantity] = useState(1)
  const [country, setCountry] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  if (!open) return null
  const t = (fr,en)=> (lang==='fr'?fr:en)
  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!name || name.trim().length<2) { setStatus('error'); setMessage(t('Veuillez entrer votre nom.','Please enter your name.')); return }
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!okEmail) { setStatus('error'); setMessage(t('Merci d’entrer un email valide.','Please enter a valid email.')); return }
    if (!['print','digital'].includes(String(format))) { setStatus('error'); setMessage(t('Sélectionnez un format.','Select a format.')); return }
    const qty = Math.max(1, Math.min(1000, Number(quantity)||1))
    setStatus('loading')
    try {
      const tokenEl = document.querySelector('.ts-preorder input[name="cf-turnstile-response"]')
      const tsToken = tokenEl ? tokenEl.value : ''
      const base = import.meta.env && import.meta.env.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) { setStatus('error'); setMessage(t('Une erreur est survenue','Something went wrong.')); return }
      const url = `${base.replace(/\/$/, '')}/preorder`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name, email, phone, format, quantity: qty, country, notes, lang, tsToken }) })
      if (res.ok) {
        setStatus('success'); setMessage(t('Merci ! Votre demande de précommande a bien été envoyée. Nous vous recontactons rapidement.','Thank you! Your pre-order request has been sent. We’ll get back to you shortly.'))
        setName(''); setEmail(''); setPhone(''); setFormat('print'); setQuantity(1); setCountry(''); setNotes('')
      } else {
        const txt = await res.text().catch(()=> '')
        setStatus('error'); setMessage(t('Une erreur est survenue. Réessayez ou écrivez-nous: contact@zonzerigueleadership.com.', 'Something went wrong. Try again or email us: contact@zonzerigueleadership.com.') + (txt? ' '+txt: ''))
      }
    } catch (err) {
      console.error(err); setStatus('error'); setMessage(t('Réseau indisponible. Réessayez plus tard ou contactez-nous.','Network unavailable. Please try later or contact us.'))
    }
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('Précommander le livre','Pre-order the book')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <p className="mt-2 text-sm text-gray-600">{t('Remplissez ce formulaire et nous reviendrons vers vous pour finaliser la précommande.','Fill out this form and we’ll follow up to finalize your pre-order.')}</p>
        <form className="mt-4 grid gap-3 ts-preorder" onSubmit={onSubmit}>
          <div className="grid gap-1">
            <label htmlFor="po-name" className="text-xs font-medium text-gray-700">{t('Nom','Name')}</label>
            <input id="po-name" type="text" value={name} onChange={(e)=>setName(e.target.value)} required className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={t('Votre nom','Your name')} />
          </div>
          <div className="grid gap-1">
            <label htmlFor="po-email" className="text-xs font-medium text-gray-700">Email</label>
            <input id="po-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={t('vous@exemple.com','you@example.com')} />
          </div>
          <div className="grid gap-1">
            <label htmlFor="po-phone" className="text-xs font-medium text-gray-700">{t('Téléphone (optionnel)','Phone (optional)')}</label>
            <input id="po-phone" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={t('+33…','+1…')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label htmlFor="po-format" className="text-xs font-medium text-gray-700">{t('Format','Format')}</label>
              <select id="po-format" value={format} onChange={(e)=>setFormat(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10">
                <option value="print">{t('Broché (papier)','Print')}</option>
                <option value="digital">{t('Numérique (PDF/eBook)','Digital (PDF/eBook)')}</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label htmlFor="po-qty" className="text-xs font-medium text-gray-700">{t('Quantité','Quantity')}</label>
              <input id="po-qty" type="number" min={1} max={1000} value={quantity} onChange={(e)=>setQuantity(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10" />
            </div>
          </div>
          <div className="grid gap-1">
            <label htmlFor="po-country" className="text-xs font-medium text-gray-700">{t('Pays (optionnel)','Country (optional)')}</label>
            <input id="po-country" type="text" value={country} onChange={(e)=>setCountry(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={t('France','United States')} />
          </div>
          <div className="grid gap-1">
            <label htmlFor="po-notes" className="text-xs font-medium text-gray-700">{t('Message (optionnel)','Message (optional)')}</label>
            <textarea id="po-notes" rows={4} value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={t('Informations utiles (adresse, souhaits…)','Useful details (address, preferences…)')}></textarea>
          </div>
          <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}></div>
          <button type="submit" disabled={status==='loading'} className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60">{status==='loading' ? t('Envoi…','Sending…') : t('Envoyer la demande','Send request')}</button>
          {message && (<div className={`text-xs ${status==='error'?'text-red-600':'text-emerald-600'}`}>{message}</div>)}
          <div className="text-[11px] text-gray-500">{t('Nous vous contacterons par email pour confirmer et finaliser la précommande.','We will contact you by email to confirm and finalize the pre-order.')}</div>
        </form>
      </div>
    </div>
  )
}
