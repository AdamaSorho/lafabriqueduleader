import { orderUrl } from '../content'

export default function Why({ strings }) {
  const formatInline = (text) => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(text)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    return { __html: html }
  }
  return (
    <div id="why" className="space-y-6">
      <p className="text-sm text-gray-700" dangerouslySetInnerHTML={formatInline(strings.why.lead)} />
      <p className="text-sm text-gray-700" dangerouslySetInnerHTML={formatInline(strings.why.body)} />
      <ul className="grid gap-3 sm:grid-cols-3">
        {strings.why.bullets.map((b) => (
          <li key={b} className="rounded-2xl border border-black/10 p-4 text-sm text-gray-800" dangerouslySetInnerHTML={formatInline(b)} />
        ))}
      </ul>
      <a href={orderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
        {strings.why.cta}
      </a>
    </div>
  )
}

