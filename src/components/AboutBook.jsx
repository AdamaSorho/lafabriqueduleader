export default function AboutBook({ strings, onOpenPreorder }) {
  const { body = [], pillars = [], closing = '', cta = '' } = strings.about
  const formatInline = (text) => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(text)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    return { __html: html }
  }
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-4 text-sm leading-7 text-gray-700">
        {body.map((p, i) => (<p key={i} dangerouslySetInnerHTML={formatInline(p)} />))}
        <p dangerouslySetInnerHTML={formatInline(closing)} />
        <a href="#contact" onClick={(e) => { e.preventDefault(); onOpenPreorder?.(); }} className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">{cta}</a>
      </div>
      <div className="grid content-start gap-4">
        {pillars.map((p, i) => (
          <div key={p} className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-black text-xs font-semibold text-white">{i + 1}</div>
            <p className="text-sm text-gray-800" dangerouslySetInnerHTML={formatInline(p)} />
          </div>
        ))}
      </div>
    </div>
  )
}

