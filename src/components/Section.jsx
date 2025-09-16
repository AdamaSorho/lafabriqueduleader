export default function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="relative isolate bg-white py-16 sm:py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">{eyebrow}</div>
          )}
          <h2 className="mt-3 font-serif text-3xl italic tracking-tight text-gray-900 sm:text-4xl md:text-5xl">{title}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">{children}</div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[200px] bg-[radial-gradient(40%_60%_at_50%_100%,rgba(0,0,0,0.06),transparent_70%)]" />
    </section>
  )
}

