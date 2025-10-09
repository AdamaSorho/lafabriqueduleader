const dotClasses = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
}

export default function BeyondTheBook({ strings, lang, onOpenKeynote, onOpenCoaching }) {
  const page = strings?.beyond
  if (!page) return null
  const onCtaClick = (cta) => {
    if (!cta) return
    if (cta.type === 'keynote') {
      onOpenKeynote?.()
    } else if (cta.type === 'coaching') {
      onOpenCoaching?.()
    }
  }

  return (
    <div className="bg-white pt-28 pb-24 sm:pt-36">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-black/10 bg-white/70 p-10 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-4xl italic leading-tight text-gray-900 sm:text-5xl md:text-[3.5rem]">
            {page.title}
          </h1>
          <p className="mt-6 text-base text-gray-700 sm:text-lg">{page.lead}</p>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8">
          {page.sections.map((section) => {
            const isAction = section.cta?.type === 'keynote' || section.cta?.type === 'coaching'
            const isLink = section.cta?.type === 'link'
            const accentClass = dotClasses[section.cta?.accent] || 'bg-emerald-500'
            return (
              <article
                key={section.id}
                id={section.id}
                className="rounded-[28px] border border-black/10 bg-white/80 p-8 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="lg:max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
                      {section.eyebrow}
                    </p>
                    <h2 className="mt-3 font-serif text-3xl italic leading-snug text-gray-900 sm:text-[2.5rem]">
                      {section.title}
                    </h2>
                    <p className="mt-5 text-base text-gray-700 sm:text-lg whitespace-pre-line">
                      {section.body}
                    </p>
                  </div>
                  {section.cta && (
                    <div className="flex min-w-[220px] flex-col items-start gap-3 rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${accentClass}`}
                          aria-hidden="true"
                        />
                        {section.cta.label}
                      </div>
                      {section.cta.description && (
                        <p className="text-xs text-gray-500">{section.cta.description}</p>
                      )}
                      {isLink ? (
                        <a
                          className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                          href={section.cta.href}
                          target={section.cta.external ? '_blank' : undefined}
                          rel={section.cta.external ? 'noreferrer' : undefined}
                        >
                          {section.cta.button}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCtaClick(section.cta)}
                          className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        >
                          {section.cta.button}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {page.closing && (
        <section className="mx-auto mt-16 max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-10 text-white shadow-lg">
            <h2 className="font-serif text-3xl italic leading-tight sm:text-4xl">{page.closing.title}</h2>
            <p className="mt-5 text-base text-gray-200 sm:text-lg">{page.closing.body}</p>
          </div>
        </section>
      )}
    </div>
  )
}
