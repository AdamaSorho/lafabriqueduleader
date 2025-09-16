import { useState } from 'react'

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-black/10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50" aria-expanded={open}>
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <span className="text-gray-400 transition-transform duration-200" style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      {open && <div className="px-5 pb-5 text-sm text-gray-700">{a}</div>}
    </div>
  )
}

export default function FAQ({ strings }) {
  const items = strings.faq.items
  return (
    <div className="grid gap-3">
      {items.map((it) => (<FAQItem key={it.q} q={it.q} a={it.a} />))}
    </div>
  )
}

