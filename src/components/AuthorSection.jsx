import author from '../assets/Soro.jpg'

export default function AuthorSection({ strings }) {
  const paras = strings.author.body || []
  const formatInline = (text) => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(text)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    return { __html: html }
  }
  return (
    <section id="author" className="relative isolate py-10 sm:py-14 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-neutral-950 text-white">
          <div className="grid md:grid-cols-2">
            <div className="relative bg-black">
              <img src={author} alt="Coach Zed" className="h-[680px] w-full object-contain md:h-[760px] lg:h-[860px]" />
            </div>
            <div className="p-8 md:p-12">
              <h2 className="font-serif text-3xl italic tracking-tight text-white sm:text-4xl">{strings.author.title}</h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-white/90">
                {paras.map((p,i) => (<p key={i} dangerouslySetInnerHTML={formatInline(p)} />))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -z-10 h-[200px] bg-[radial-gradient(40%_60%_at_50%_100%,rgba(0,0,0,0.06),transparent_70%)]" />
    </section>
  )
}

