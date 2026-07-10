import { trackEvent } from '../utils/tracking'
import { buildWhatsAppOrderUrl } from '../utils/whatsapp'

export default function GiftGroup({ strings, lang }) {
  const block = strings.giftGroup
  if (!block) return null
  const bulkOption = strings.order.options.find((option) => option.id === 'team')
  const teamOption = strings.order.options.find((option) => option.id === 'enterprise')

  const handleClick = (intent, eventName) => {
    trackEvent(eventName, {
      order_type: intent.id || intent.orderType,
      customer_type: intent.customerType,
      source: 'gift_group_section',
    })
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4 text-sm leading-7 text-gray-700">
        <p>{block.body}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={buildWhatsAppOrderUrl({
              lang,
              orderType: bulkOption.id,
              title: bulkOption.title,
              quantity: bulkOption.quantity,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(bulkOption, 'group_request_click')}
            className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
          >
            {block.ctas.bulk}
          </a>
          <a
            href={buildWhatsAppOrderUrl({
              lang,
              orderType: teamOption.id,
              title: teamOption.title,
              quantity: teamOption.quantity,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(teamOption, 'enterprise_request_click')}
            className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            {block.ctas.team}
          </a>
        </div>
      </div>
      <div className="rounded-2xl border border-black/10 bg-gray-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {block.noteLabel}
        </p>
        <p className="mt-3 text-sm leading-6 text-gray-700">{block.note}</p>
      </div>
    </div>
  )
}
