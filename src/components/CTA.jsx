import { trackEvent } from '../utils/tracking'
import { buildWhatsAppOrderUrl } from '../utils/whatsapp'

export default function CTA({ strings, lang, onOpenExcerpt }) {
  const groupOption = strings.order.options.find((option) => option.id === 'team')

  const handleGroupOffer = () => {
    trackEvent('group_request_click', { source: 'final_cta', order_type: 'team' })
  }

  return (
    <section className="relative isolate mx-4 my-20 rounded-3xl bg-gray-900 px-6 py-14 text-white sm:mx-auto sm:max-w-7xl sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{strings.finalCta.title}</h2>
        <p className="mt-3 text-sm text-gray-300">{strings.finalCta.sub}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#commander"
            onClick={() => trackEvent('order_click', { source: 'final_cta' })}
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {strings.finalCta.ctas.preorder}
          </a>
          <a
            href={buildWhatsAppOrderUrl({
              lang,
              orderType: groupOption.id,
              title: groupOption.title,
              quantity: groupOption.quantity,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGroupOffer}
            className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {strings.finalCta.ctas.group}
          </a>
          <button
            type="button"
            onClick={() => {
              trackEvent('excerpt_click', { source: 'final_cta' })
              onOpenExcerpt?.()
            }}
            className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {strings.finalCta.ctas.excerpt}
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.15),transparent)]" />
    </section>
  )
}
