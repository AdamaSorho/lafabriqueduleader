import { useEffect, useState } from 'react'
import { trackEvent } from '../utils/tracking'
import RequiredMark from './RequiredMark'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact({ strings, lang, initialIntent }) {
  const copy = strings.contact
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cityCountry, setCityCountry] = useState('')
  const [orderType, setOrderType] = useState('single')
  const [quantity, setQuantity] = useState(1)
  const [preferredMode, setPreferredMode] = useState('delivery')
  const [customerType, setCustomerType] = useState('individual')
  const [message, setMessage] = useState('')
  const [ambassadorCode, setAmbassadorCode] = useState('')
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!initialIntent) return
    if (initialIntent.orderType) setOrderType(initialIntent.orderType)
    if (initialIntent.quantity) setQuantity(initialIntent.quantity)
    if (initialIntent.preferredMode) setPreferredMode(initialIntent.preferredMode)
    if (initialIntent.customerType) setCustomerType(initialIntent.customerType)
  }, [initialIntent])

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setWhatsapp('')
    setCityCountry('')
    setOrderType('single')
    setQuantity(1)
    setPreferredMode('delivery')
    setCustomerType('individual')
    setMessage('')
    setAmbassadorCode('')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setFeedback('')

    const qty = Math.max(1, Math.min(5000, Number(quantity) || 1))
    if (String(fullName).trim().length < 2) {
      setStatus('error')
      setFeedback(copy.errors.name)
      return
    }
    if (!emailPattern.test(email)) {
      setStatus('error')
      setFeedback(copy.errors.email)
      return
    }
    if (String(whatsapp).trim().length < 5) {
      setStatus('error')
      setFeedback(copy.errors.whatsapp)
      return
    }
    if (String(cityCountry).trim().length < 2) {
      setStatus('error')
      setFeedback(copy.errors.location)
      return
    }

    const tokenEl = document.querySelector('.ts-order input[name="cf-turnstile-response"]')
    const tsToken = tokenEl ? tokenEl.value : ''
    const payload = {
      fullName,
      email,
      whatsapp,
      cityCountry,
      orderType,
      quantity: qty,
      preferredMode,
      customerType,
      message,
      ambassadorCode,
      lang,
      tsToken,
    }

    setStatus('loading')
    try {
      const base = import.meta.env?.VITE_API_BASE ? String(import.meta.env.VITE_API_BASE) : ''
      if (!base) {
        setStatus('error')
        setFeedback(copy.errors.config)
        return
      }
      const res = await fetch(`${base.replace(/\/$/, '')}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setStatus('error')
        setFeedback(`${copy.errors.submit}${text ? ` ${text}` : ''}`)
        return
      }

      const trackingPayload = {
        order_type: orderType,
        quantity: qty,
        preferred_mode: preferredMode,
        customer_type: customerType,
        ambassador_code: ambassadorCode || '',
        has_ambassador_code: Boolean(ambassadorCode),
      }
      trackEvent('order_form_submit', trackingPayload)
      if (qty > 1 || ['duo', 'team', 'enterprise', 'special'].includes(orderType)) {
        trackEvent('group_request_submit', trackingPayload)
      }
      if (
        orderType === 'enterprise' ||
        ['enterprise', 'school', 'institution', 'organization'].includes(customerType)
      ) {
        trackEvent('enterprise_institution_submit', trackingPayload)
      }

      setStatus('success')
      setFeedback(copy.success)
      resetForm()
    } catch (err) {
      console.error(err)
      setStatus('error')
      setFeedback(copy.errors.network)
    }
  }

  return (
    <form className="mx-auto grid max-w-4xl gap-5 ts-order" onSubmit={onSubmit}>
      {copy.intro && <p className="text-center text-sm leading-7 text-gray-700">{copy.intro}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.fields.fullName} htmlFor="order-full-name" required>
          <input
            id="order-full-name"
            name="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
            placeholder={copy.placeholders.fullName}
          />
        </Field>
        <Field label={copy.fields.email} htmlFor="order-email" required>
          <input
            id="order-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
            placeholder="vous@exemple.com"
          />
        </Field>
        <Field label={copy.fields.whatsapp} htmlFor="order-whatsapp" required>
          <input
            id="order-whatsapp"
            name="whatsapp"
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
            placeholder={copy.placeholders.whatsapp}
          />
        </Field>
        <Field label={copy.fields.location} htmlFor="order-location" required>
          <input
            id="order-location"
            name="cityCountry"
            type="text"
            required
            value={cityCountry}
            onChange={(e) => setCityCountry(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
            placeholder={copy.placeholders.location}
          />
        </Field>
        <Field label={copy.fields.orderType} htmlFor="order-type" required>
          <select
            id="order-type"
            name="orderType"
            required
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
          >
            {copy.orderTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.fields.quantity} htmlFor="order-quantity" required>
          <input
            id="order-quantity"
            name="quantity"
            type="number"
            min={1}
            max={5000}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
          />
        </Field>
        <Field label={copy.fields.preferredMode} htmlFor="order-preferred-mode" required>
          <select
            id="order-preferred-mode"
            name="preferredMode"
            required
            value={preferredMode}
            onChange={(e) => setPreferredMode(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
          >
            {copy.preferredModes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.fields.customerType} htmlFor="order-customer-type" required>
          <select
            id="order-customer-type"
            name="customerType"
            required
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black/10"
          >
            {copy.customerTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={copy.fields.message} htmlFor="order-message">
        <textarea
          id="order-message"
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          placeholder={copy.placeholders.message}
        />
      </Field>
      <Field label={copy.fields.ambassadorCode} htmlFor="order-ambassador-code">
        <input
          id="order-ambassador-code"
          name="ambassadorCode"
          type="text"
          value={ambassadorCode}
          onChange={(e) => setAmbassadorCode(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          placeholder={copy.placeholders.ambassadorCode}
        />
      </Field>
      <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
        >
          {status === 'loading' ? copy.submitting : copy.submit}
        </button>
        <a
          href="mailto:contact@zonzerigueleadership.com"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {copy.emailFallback}
        </a>
      </div>
      {feedback && (
        <div className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
          {feedback}
        </div>
      )}
      <div className="text-[11px] leading-5 text-gray-500">
        {copy.privacy}
      </div>
    </form>
  )
}

function Field({ label, htmlFor, required = false, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-gray-700">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
    </div>
  )
}
