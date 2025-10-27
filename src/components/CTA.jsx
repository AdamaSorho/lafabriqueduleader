export default function CTA({ strings, onOpenExcerpt, onOpenPreorder }) {
  return (
    <section className="relative isolate mx-4 my-20 rounded-3xl bg-gray-900 px-6 py-14 text-white sm:mx-auto sm:max-w-7xl sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{strings.finalCta.title}</h2>
        <p className="mt-3 text-sm text-gray-300">{strings.finalCta.sub}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="#contact" onClick={(e) => { e.preventDefault(); onOpenPreorder?.(); }} className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100">{strings.finalCta.ctas.preorder}</a>
          <button type="button" onClick={onOpenExcerpt} className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">{strings.finalCta.ctas.excerpt}</button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.15),transparent)]" />
    </section>
  )
}
