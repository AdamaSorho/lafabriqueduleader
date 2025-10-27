export default function Hero({
  strings,
  onOpenExcerpt,
  onOpenPreorder,
  lang = "fr",
}) {
  const isEn = String(lang || "").toLowerCase().startsWith("en");
  const modelSrc = isEn ? "/assets/models/book-en.glb" : "/assets/models/book-fr.glb";
  return (
    <section className="relative isolate overflow-hidden bg-white pt-28 sm:pt-36">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              {strings.hero.brand}
            </p>
            <h1 className="mt-5 font-serif text-5xl italic leading-tight tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
              {strings.hero.title}
            </h1>
            <p className="mt-6 text-base text-gray-600 sm:text-lg">
              {strings.hero.sub}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPreorder?.();
                }}
                className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90"
              >
                {strings.hero.ctas.preorder}
              </a>
              <button
                type="button"
                onClick={onOpenExcerpt}
                className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                {strings.hero.ctas.excerpt}
              </button>
            </div>
          </div>
          <div className="relative">
            <model-viewer
              src={modelSrc}
              alt={isEn ? "Book preview" : "Aperçu du livre"}
              camera-controls
              auto-rotate
              shadow-intensity="0.4"
              environment-image="neutral"
              poster="/assets/models/book-poster.svg"
              style={{ width: "100%", height: "400px", background: "transparent" }}
              className="w-full"
            ></model-viewer>
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent)]" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(40%_60%_at_50%_0%,rgba(0,0,0,0.08),transparent_70%)]" />
    </section>
  );
}
