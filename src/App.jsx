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
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-black" aria-hidden />
          <span className="font-semibold">La Fabrique du Leader</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#programmes" className="text-sm font-medium text-gray-700 hover:text-black">Programmes</a>
          <a href="#approche" className="text-sm font-medium text-gray-700 hover:text-black">Approche</a>
          <a href="#temoignages" className="text-sm font-medium text-gray-700 hover:text-black">Témoignages</a>
          <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-black">Contact</a>
        </div>
        <a href="#contact" className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">Nous rejoindre</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white pt-28 sm:pt-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Coaching • Formation • Conseil
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Forgez un leadership clair, humain et puissant.
          </h1>
          <p className="mt-5 text-base text-gray-600 sm:text-lg">
            Nous accompagnons dirigeant·es et équipes à développer la clarté, la confiance et l’impact au quotidien.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <a href="#contact" className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90">Parler à un coach</a>
            <a href="#programmes" className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">Découvrir nos programmes</a>
          </div>
        </div>
        <div className="relative">
          <img src={img1} alt="Coaching en action" className="w-full rounded-3xl border border-black/10 object-cover shadow-sm" />
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(60%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent)]" />
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
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
    <section id={id} className="relative isolate bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">{eyebrow}</div>
          )}
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">{title}</h2>
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
    { name: 'Coaching dirigeants', desc: 'Accompagnement individuel sur-mesure pour dirigeants et fondatrices/fondateurs.' },
    { name: 'Coaching d’équipe', desc: 'Alignement, performance collective et qualité relationnelle.' },
    { name: 'Formations', desc: 'Ateliers pratiques: feedback, décision, priorisation, communication, posture.' },
  ]
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((p) => (
        <div key={p.name} className="flex flex-col justify-between rounded-2xl border border-black/10 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
            <p className="mt-2 text-sm text-gray-600">{p.desc}</p>
          </div>
          <a href="#contact" className="mt-6 inline-flex w-fit items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">En savoir plus</a>
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
        <figure key={i} className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center gap-3">
            <img src={author} alt="Auteur" className="size-9 rounded-full object-cover" />
            <figcaption className="text-xs font-semibold text-gray-700">{q.name}</figcaption>
          </div>
          <blockquote className="mt-3 text-sm text-gray-700">“{q.text}”</blockquote>
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
    <div className="min-h-full bg-white text-gray-900">
      <Nav />
      <main>
        <Hero />
        <Section id="approche" eyebrow="Notre approche" title="Concret, exigeant et profondément humain">
          <Features />
        </Section>
        <Section id="programmes" eyebrow="Programmes" title="Des formats adaptés à vos enjeux">
          <Programs />
        </Section>
        <Section id="temoignages" eyebrow="Témoignages" title="Ce que disent nos client·es">
          <Testimonials />
        </Section>
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
