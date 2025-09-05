import { useEffect, useMemo, useState } from "react";
import { content } from "./content";
import img1 from "./assets/image1.avif";
import author from "./assets/Soro.jpg";

function useLang() {
  const [lang, setLang] = useState(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("lang");
    const cached = localStorage.getItem("lang");
    return param || cached || "fr";
  });
  useEffect(() => {
    localStorage.setItem("lang", lang);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url);
  }, [lang]);
  const strings = useMemo(() => content[lang], [lang]);
  return { lang, setLang, strings };
}

function LangToggle({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 p-0.5 text-xs">
      {["fr", "en"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2 py-1 ${
            lang === l
              ? "bg-black text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Nav({ lang, setLang, strings }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-black" aria-hidden />
          <span className="font-semibold tracking-tight">
            {strings.hero.brand}
          </span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#why"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            {lang === "fr" ? "Pourquoi" : "Why"}
          </a>
          <a
            href="#author"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            {lang === "fr" ? "Auteur" : "Author"}
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            {lang === "fr" ? "À propos" : "About"}
          </a>
          <a
            href="#learn"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            {lang === "fr" ? "Apprentissages" : "Learn"}
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} setLang={setLang} />
          <a
            href="#contact"
            className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            {strings.nav?.preorder}
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero({ strings, onOpenExcerpt }) {
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
            <img
              src={img1}
              alt="Visuel de présentation"
              className="w-full rounded-3xl border border-black/10 object-cover shadow-sm"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent)]" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(40%_60%_at_50%_0%,rgba(0,0,0,0.08),transparent_70%)]" />
    </section>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section
      id={id}
      className="relative isolate bg-white py-16 sm:py-20 scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-3 font-serif text-3xl italic tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">{children}</div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[200px] bg-[radial-gradient(40%_60%_at_50%_100%,rgba(0,0,0,0.06),transparent_70%)]" />
    </section>
  );
}

function Why({ strings }) {
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
      <a href="#contact" className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
        {strings.why.cta}
      </a>
    </div>
  );
}

function AuthorSection({ strings }) {
  const paras = strings.author.body || []
  const formatInline = (text) => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(text)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    return { __html: html }
  }
  return (
    <section id="author" className="relative isolate py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-neutral-950 text-white">
          <div className="grid md:grid-cols-2">
            <div className="relative bg-black">
              <img
                src={author}
                alt="Coach Zed"
                className="h-[680px] w-full object-contain md:h-[760px] lg:h-[860px]"
              />
            </div>
            <div className="p-8 md:p-12">
              <h2 className="font-serif text-3xl italic tracking-tight text-white sm:text-4xl">
                {strings.author.title}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-white/90">
                {paras.map((p, i) => (
                  <p key={i} dangerouslySetInnerHTML={formatInline(p)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -z-10 h-[200px] bg-[radial-gradient(40%_60%_at_50%_100%,rgba(0,0,0,0.06),transparent_70%)]" />
    </section>
  )
}

function AboutBook({ strings }) {
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
        {body.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={formatInline(p)} />
        ))}
        <p dangerouslySetInnerHTML={formatInline(closing)} />
        <a href="#contact" className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
          {cta}
        </a>
      </div>
      <div className="grid content-start gap-4">
        {pillars.map((p, i) => (
          <div key={p} className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-black text-xs font-semibold text-white">
              {i + 1}
            </div>
            <p className="text-sm text-gray-800" dangerouslySetInnerHTML={formatInline(p)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Testimonials({ strings }) {
  const quotes = strings.testimonials.quotes;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {quotes.map((q, i) => (
        <figure
          key={i}
          className="rounded-3xl border border-black/10 bg-white p-6"
        >
          <div className="mb-3 flex items-center gap-1 text-yellow-400" aria-hidden>
            {[0,1,2,3,4].map((s) => (
              <svg key={s} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-[18px]">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-sm text-gray-700">“{q.text}”</blockquote>
          <figcaption className="mt-4 text-xs font-semibold text-gray-700">
            {q.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function CTA({ strings, onOpenExcerpt }) {
  return (
    <section className="relative isolate mx-4 my-20 rounded-3xl bg-gray-900 px-6 py-14 text-white sm:mx-auto sm:max-w-7xl sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {strings.finalCta.title}
        </h2>
        <p className="mt-3 text-sm text-gray-300">{strings.finalCta.sub}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="#contact"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {strings.finalCta.ctas.preorder}
          </a>
          <button
            type="button"
            onClick={onOpenExcerpt}
            className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {strings.finalCta.ctas.excerpt}
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.15),transparent)]" />
    </section>
  );
}

function Footer({ strings }) {
  const email = strings.footer?.email
  const socials = strings.footer?.socials || []
  const Icon = ({ kind }) => {
    const cls = "size-4"
    switch (kind) {
      case "linkedin":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM9 8h4.8v2.2h.07c.67-1.2 2.3-2.47 4.73-2.47C22.4 7.73 24 10 24 13.6V24h-5v-8.6c0-2.05-.04-4.69-2.86-4.69-2.86 0-3.3 2.23-3.3 4.54V24H9z"/></svg>
        )
      case "x":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2H21l-6.79 7.74L22 22h-5.82l-4.55-5.9L6.2 22H3.44l7.25-8.27L2 2h5.94l4.1 5.47L18.24 2zM8.24 4H6.08l9.78 13.11h2.23L8.24 4z"/></svg>
        )
      case "instagram":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18.5 5.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
        )
      case "youtube":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.7 3.5 12 3.5 12 3.5s-7.7 0-9.4.6A3 3 0 00.5 6.2C0 7.9 0 12 0 12s0 4.1.5 5.8a3 3 0 002.1 2.1c1.7.6 9.4.6 9.4.6s7.7 0 9.4-.6a3 3 0 002.1-2.1c.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
        )
      default:
        return null
    }
  }
  return (
    <footer id="contact" className="border-t border-black/10 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-black" aria-hidden />
          <span className="text-sm font-semibold">La Fabrique du Leader</span>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {email && (
            <a href={`mailto:${email}`} className="text-xs text-gray-700 hover:text-black">{email}</a>
          )}
          {socials.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{strings.footer.follow}</span>
              {socials.filter(s => s.url).map((s) => (
                <a key={s.kind} href={s.url} aria-label={s.label} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-black/10 p-2 text-gray-700 hover:bg-gray-50 hover:text-black">
                  <Icon kind={s.kind} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">© {new Date().getFullYear()} — Tous droits réservés</div>
      </div>
    </footer>
  );
}

export default function App() {
  const { lang, setLang, strings } = useLang();
  const [excerptOpen, setExcerptOpen] = useState(false);
  return (
    <div className="min-h-full bg-white text-gray-900 font-sans">
      <Nav lang={lang} setLang={setLang} strings={strings} />
      <main>
        <Hero strings={strings} onOpenExcerpt={() => setExcerptOpen(true)} />
        <Section
          id="why"
          eyebrow={strings.hero.brand}
          title={strings.why.title}
        >
          <Why strings={strings} />
        </Section>
        <AuthorSection strings={strings} />
        <Section id="about" eyebrow={strings.hero.brand} title={strings.about.title}>
          <AboutBook strings={strings} />
        </Section>
        <Section
          id="learn"
          eyebrow={strings.hero.brand}
          title={strings.learn.title}
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {strings.learn.bullets.map((b) => (
              <li
                key={b}
                className="rounded-2xl border border-black/10 p-4 text-sm text-gray-800"
              >
                {b}
              </li>
            ))}
          </ul>
        </Section>
        <Section
          id="temoignages"
          eyebrow={strings.hero.brand}
          title={strings.testimonials.title}
        >
          <Testimonials strings={strings} />
        </Section>
        <Section
          id="faq"
          eyebrow={strings.hero.brand}
          title={strings.faq.title}
        >
          <FAQ strings={strings} />
        </Section>
        <CTA strings={strings} onOpenExcerpt={() => setExcerptOpen(true)} />
        <Section
          id="contact"
          eyebrow={strings.footer.contact}
          title={strings.footer.contact}
        >
          <Contact lang={lang} />
        </Section>
      </main>
      <Footer strings={strings} />
      <ExcerptModal open={excerptOpen} onClose={() => setExcerptOpen(false)} lang={lang} />
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-black/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <span
          className="text-gray-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      {open && <div className="px-5 pb-5 text-sm text-gray-700">{a}</div>}
    </div>
  );
}

function FAQ({ strings }) {
  const items = strings.faq.items;
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <FAQItem key={it.q} q={it.q} a={it.a} />
      ))}
    </div>
  );
}

function Contact({ lang }) {
  return (
    <form className="mx-auto grid max-w-2xl gap-4">
      <div className="grid gap-1">
        <label htmlFor="name" className="text-xs font-medium text-gray-700">
          {lang === "fr" ? "Nom" : "Name"}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          placeholder="Votre nom"
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email" className="text-xs font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          placeholder="vous@exemple.com"
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="message" className="text-xs font-medium text-gray-700">
          {lang === "fr" ? "Message" : "Message"}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          placeholder="Quelques mots sur vos enjeux"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {lang === "fr" ? "Envoyer" : "Send"}
        </button>
        <a
          href="mailto:contact@lafabriqueduleader.com"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {lang === "fr"
            ? "ou nous écrire directement"
            : "or write to us directly"}
        </a>
      </div>
    </form>
  );
}

function ExcerptModal({ open, onClose, lang }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  if (!open) return null

  const t = (fr, en) => (lang === 'fr' ? fr : en)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    // basic email validation
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) {
      setMessage(t('Merci d’entrer un email valide.', 'Please enter a valid email.'))
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const base = (import.meta.env && import.meta.env.VITE_API_BASE) ? String(import.meta.env.VITE_API_BASE) : ''
      const url = base ? `${base.replace(/\/$/, '')}/subscribe-and-send` : '/api/subscribe-and-send'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage(
          t(
            'Merci ! Consultez votre boîte mail pour le lien de téléchargement.',
            'Thank you! Check your inbox for the download link.'
          )
        )
        setEmail('')
      } else {
        const txt = await res.text().catch(() => '')
        setStatus('error')
        setMessage(
          t(
            `Une erreur est survenue. Réessayez ou écrivez-nous: contact@lafabriqueduleader.com. ${txt}`,
            `Something went wrong. Try again or email us: contact@lafabriqueduleader.com. ${txt}`
          )
        )
      }
    } catch (err) {
      setStatus('error')
      setMessage(
        t(
          'Réseau indisponible. Réessayez plus tard ou contactez-nous.',
          'Network unavailable. Please try later or contact us.'
        )
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('Télécharger un extrait', 'Download an excerpt')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {t(
            'Entrez votre email pour recevoir le lien de téléchargement. Nous pourrons aussi vous écrire pour des nouvelles liées au livre (désinscription possible à tout moment).',
            'Enter your email to receive the download link. We may also email you book-related updates (unsubscribe anytime).'
          )}
        </p>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('vous@exemple.com', 'you@example.com')}
            required
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
          >
            {status === 'loading' ? t('Envoi…', 'Sending…') : t('Envoyer le lien', 'Send the link')}
          </button>
          {message && (
            <div className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{message}</div>
          )}
          <div className="text-[11px] text-gray-500">
            {t(
              'En soumettant, vous acceptez de recevoir des emails de notre part. Vos données ne seront pas partagées. Désinscription à tout moment.',
              'By submitting, you agree to receive emails from us. We do not share your data. Unsubscribe anytime.'
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
