export default function Testimonials({ strings, onOpenExcerpt, onOpenPreorder }) {
  const quotes = strings.testimonials.quotes
  const intro = strings.testimonials.intro
  const outro = strings.testimonials.outro
  return (
    <div className="space-y-6">
      {intro && (<p className="text-sm text-gray-700">{intro}</p>)}
      <div className="grid gap-6 md:grid-cols-3">
        {quotes.map((q, i) => (
          <figure key={i} className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="mb-3 flex items-center gap-1 text-yellow-400" aria-hidden>
              {[0,1,2,3,4].map((s) => (
                <svg key={s} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-[18px]"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              ))}
            </div>
            <blockquote className="text-sm text-gray-700">“{q.text}”</blockquote>
            <figcaption className="mt-4 text-xs font-semibold text-gray-700">{q.name}</figcaption>
          </figure>
        ))}
      </div>
      {outro && (
        <div className="mt-2">
          <div className="mb-3 flex justify-center text-black/20" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M7.17 6C5.97 6 5 6.97 5 8.17v3.66C5 13.03 5.97 14 7.17 14H9v4H3v-8.17C3 7.41 5.41 5 8.83 5H9v1H7.17zM18.17 6C16.97 6 16 6.97 16 8.17v3.66C16 13.03 16.97 14 18.17 14H20v4h-6v-8.17C14 7.41 16.41 5 19.83 5H20v1h-1.83z"/></svg>
          </div>
          <blockquote className="mx-auto max-w-3xl text-center text-lg sm:text-xl md:text-2xl italic text-gray-900 space-y-2">
            {Array.isArray(outro) ? outro.map((p,i)=> (<p key={i}>{p}</p>)) : (<p>{outro}</p>)}
          </blockquote>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href="#contact" onClick={(e)=>{e.preventDefault(); onOpenPreorder?.();}} className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90">{strings.hero.ctas.preorder}</a>
            <button type="button" onClick={onOpenExcerpt} className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">{strings.hero.ctas.excerpt}</button>
          </div>
        </div>
      )}
    </div>
  )
}

