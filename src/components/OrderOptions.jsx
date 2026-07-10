import { orderUrl } from '../content'
import { trackEvent } from '../utils/tracking'
import { buildWhatsAppOrderUrl } from '../utils/whatsapp'

export default function OrderOptions({ strings, lang }) {
  const order = strings.order
  if (!order) return null

  const handleOrder = (option) => {
    const payload = {
      order_type: option.id,
      quantity: option.quantity || 1,
      customer_type: option.customerType || '',
      source: 'order_section',
    }
    trackEvent('order_click', payload)
    if (option.groupRequest) trackEvent('group_request_click', payload)
    if (option.enterpriseRequest) trackEvent('enterprise_request_click', payload)
  }

  return (
    <div className="space-y-8">
      {order.intro && (
        <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-gray-700">
          {order.intro}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {order.options.map((option) => (
          <article
            key={option.id}
            className="flex min-h-[250px] flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                {option.eyebrow}
              </p>
              <h3 className="mt-3 text-base font-semibold text-gray-950">{option.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">{option.body}</p>
            </div>
            <a
              href={buildWhatsAppOrderUrl({
                lang,
                orderType: option.id,
                title: option.title,
                quantity: option.quantity,
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleOrder(option)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black/90"
            >
              {option.cta}
            </a>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{order.amazon.title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">{order.amazon.body}</p>
        </div>
        <a
          href={orderUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('amazon_order_click', { source: 'order_section' })}
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          {order.amazon.cta}
        </a>
      </div>
    </div>
  )
}
