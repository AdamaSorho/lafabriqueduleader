export default function Audience({ strings }) {
  const items = strings.audience?.items || []
  if (!items.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        >
          <h3 className="text-sm font-semibold text-gray-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-gray-700">{item.body}</p>
        </article>
      ))}
    </div>
  )
}
