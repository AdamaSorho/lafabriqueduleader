import img1 from './assets/image1.avif'
import img2 from './assets/image2.avif'
import img3 from './assets/image3.avif'
import img4 from './assets/image4.avif'
import img5 from './assets/image5.avif'
import img6 from './assets/image6.avif'
import author from './assets/author.avif'

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-black" aria-hidden />
          <span className="font-semibold tracking-tight">La Fabrique du Leader</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#work" className="text-sm font-medium text-gray-700 hover:text-black">Réalisations</a>
          <a href="#services" className="text-sm font-medium text-gray-700 hover:text-black">Services</a>
          <a href="#about" className="text-sm font-medium text-gray-700 hover:text-black">À propos</a>
          <a href="#temoignages" className="text-sm font-medium text-gray-700 hover:text-black">Témoignages</a>
        </div>
        <a href="#contact" className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">Nous rejoindre</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white pt-28 sm:pt-36">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-widest text-gray-500">Coaching • Conseil • Formation</p>
            <h1 className="mt-5 font-serif text-5xl italic leading-tight tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
              Forgez un leadership clair,<br className="hidden sm:block" /> humain et puissant.
            </h1>
            <p className="mt-6 text-base text-gray-600 sm:text-lg">
              Nous accompagnons dirigeant·es et équipes à développer la clarté, la confiance et l’impact au quotidien.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#contact" className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90">Parler à un coach</a>
              <a href="#work" className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">Voir nos réalisations</a>
            </div>
          </div>
          <div className="relative">
            <img src={img1} alt="Visuel de présentation" className="w-full rounded-3xl border border-black/10 object-cover shadow-sm" />
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent)]" />
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {[img2, img3, img4, img5, img6].map((src, idx) => (
            <img key={idx} src={src} alt="Illustration" className="h-24 w-full rounded-xl border border-black/10 object-cover" />
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(40%_60%_at_50%_0%,rgba(0,0,0,0.08),transparent_70%)]" />
    </section>
  )
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="relative isolate bg-white py-16 sm:py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">{eyebrow}</div>
          )}
          <h2 className="mt-3 font-serif text-3xl italic tracking-tight text-gray-900 sm:text-4xl md:text-5xl">{title}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-5xl">
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[200px] bg-[radial-gradient(40%_60%_at_50%_100%,rgba(0,0,0,0.06),transparent_70%)]" />
    </section>
  )
}

function Features() {
  const items = [
    {
      title: 'Clarté stratégique',
      desc: 'Affiner la vision, clarifier les priorités et décider avec confiance.'
    },
    {
      title: 'Leadership humain',
      desc: 'Cultiver une présence alignée, à l’écoute et mobilisatrice.'
    },
    {
      title: 'Exécution fiable',
      desc: 'Mettre en place des pratiques concrètes qui tiennent dans la durée.'
    }
  ]
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {items.map((f) => (
        <div key={f.title} className="rounded-2xl border border-black/10 p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
          <div className="mb-4 size-8 rounded bg-black" />
          <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
        </div>
      ))}
    </div>
  )
}

function Programs() {
  const items = [
    { name: 'Coaching dirigeants', desc: 'Accompagnement individuel sur-mesure pour dirigeants, fondatrices et fondateurs.' },
    { name: 'Coaching d’équipe', desc: 'Alignement stratégique, performance collective, qualité relationnelle.' },
    { name: 'Formations', desc: 'Feedback, décision, priorisation, communication, posture managériale.' },
  ]
  return (
    <div id="services" className="grid gap-6 md:grid-cols-3">
      {items.map((p) => (
        <div key={p.name} className="group flex flex-col justify-between rounded-3xl border border-black/10 p-6 transition hover:shadow-sm">
          <div>
            <h3 className="font-serif text-xl italic text-gray-900">{p.name}</h3>
            <p className="mt-2 text-sm text-gray-600">{p.desc}</p>
          </div>
          <a href="#contact" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            En savoir plus
            <span className="text-[--accent]">→</span>
          </a>
        </div>
      ))}
    </div>
  )
}

function Testimonials() {
  const quotes = [
    {
      name: 'Directrice générale',
      text: 'Une vraie transformation dans ma manière de décider et d’embarquer l’équipe.'
    },
    {
      name: 'CTO',
      text: 'Des outils simples, une posture claire — impact immédiat sur la collaboration.'
    },
    {
      name: 'VP Sales',
      text: 'On repart avec du concret, pas des concepts abstraits.'
    }
  ]
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {quotes.map((q, i) => (
        <figure key={i} className="rounded-3xl border border-black/10 bg-white p-6">
          <blockquote className="text-sm text-gray-700">“{q.text}”</blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <img src={author} alt="Auteur" className="size-9 rounded-full object-cover" />
            <span className="text-xs font-semibold text-gray-700">{q.name}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function CTA() {
  return (
    <section className="relative isolate mx-4 my-20 rounded-3xl bg-gray-900 px-6 py-14 text-white sm:mx-auto sm:max-w-7xl sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Prêt·e à forger votre leadership ?</h2>
        <p className="mt-3 text-sm text-gray-300">Échangeons 30 minutes pour comprendre vos enjeux et vous proposer le bon format.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a href="#contact" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100">Prendre rendez-vous</a>
          <a href="mailto:contact@lafabriqueduleader.com" className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Nous écrire</a>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.15),transparent)]" />
    </section>
  )
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-black/10 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-black" aria-hidden />
          <span className="text-sm font-semibold">La Fabrique du Leader</span>
        </div>
        <div className="text-xs text-gray-500">© {new Date().getFullYear()} — Tous droits réservés</div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-full bg-white text-gray-900 font-sans">
      <Nav />
      <main>
        <Hero />
        <Section id="work" eyebrow="Réalisations" title="Sélection de projets">
          <div className="grid gap-6 md:grid-cols-2">
            {[img1, img2, img3, img4, img5, img6].map((src, i) => (
              <figure key={i} className="group overflow-hidden rounded-3xl border border-black/10">
                <img src={src} alt={`Projet ${i + 1}`} className="aspect-[16/10] w-full object-cover transition duration-300 ease-out group-hover:scale-[1.02]" />
              </figure>
            ))}
          </div>
        </Section>
        <Section id="approche" eyebrow="Notre approche" title="Concret, exigeant et profondément humain">
          <Features />
        </Section>
        <Section id="services" eyebrow="Services" title="Des formats adaptés à vos enjeux">
          <Programs />
        </Section>
        <Section id="about" eyebrow="À propos" title="Nous accompagnons celles et ceux qui construisent">
          <div className="grid items-center gap-8 md:grid-cols-[auto,1fr]">
            <img src={author} alt="Auteur" className="size-24 rounded-full object-cover md:size-28" />
            <p className="text-sm text-gray-700">
              Nous aidons dirigeant·es, fondatrices et équipes à gagner en clarté, en confiance et en impact.
              Une approche pragmatique, humaine et durable, nourrie par l’expérience terrain.
            </p>
          </div>
        </Section>
        <Section id="faq" eyebrow="Questions" title="Questions fréquentes">
          <FAQ />
        </Section>
        <Section id="temoignages" eyebrow="Témoignages" title="Ce que disent nos client·es">
          <Testimonials />
        </Section>
        <Section id="contact" eyebrow="Contact" title="Parlons de vos enjeux">
          <Contact />
        </Section>
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-2xl border border-black/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <span className="text-gray-400 transition-transform duration-200" style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-700">{a}</div>
      )}
    </div>
  )
}

function FAQ() {
  const items = [
    {
      q: 'Quel est le format typique d’un accompagnement ?',
      a: 'Nous proposons des formats de 6 à 12 semaines, combinant sessions individuelles, ateliers d’équipe et travail entre les séances.'
    },
    {
      q: 'Intervenez-vous en présentiel et à distance ?',
      a: 'Oui. Nous combinons présentiel et visio selon les besoins, avec une logistique simple et efficace.'
    },
    {
      q: 'Quels sont vos tarifs ?',
      a: 'Ils dépendent du format et de l’ampleur de la mission. Nous partageons une proposition claire après un premier échange.'
    },
  ]
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <FAQItem key={it.q} q={it.q} a={it.a} />
      ))}
    </div>
  )
}

function Contact() {
  return (
    <form className="mx-auto grid max-w-2xl gap-4">
      <div className="grid gap-1">
        <label htmlFor="name" className="text-xs font-medium text-gray-700">Nom</label>
        <input id="name" name="name" type="text" required className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder="Votre nom" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email" className="text-xs font-medium text-gray-700">Email</label>
        <input id="email" name="email" type="email" required className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder="vous@exemple.com" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="message" className="text-xs font-medium text-gray-700">Message</label>
        <textarea id="message" name="message" rows={5} required className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder="Quelques mots sur vos enjeux" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">Envoyer</button>
        <a href="mailto:contact@lafabriqueduleader.com" className="text-sm text-gray-600 hover:text-gray-900">ou nous écrire directement</a>
      </div>
    </form>
  )
}
