import { useState } from 'react'
import logo from '../assets/logo.png'

function LangToggle({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 p-0.5 text-xs">
      {["fr", "en"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2 py-1 ${
            lang === l ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default function Nav({ lang, setLang, strings, onOpenPreorder }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src={logo} alt={strings.hero.brand} className="h-7 w-auto" />
          <span className="font-semibold tracking-tight">{strings.hero.brand}</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#why" className="text-sm font-medium text-gray-700 hover:text-black" onClick={closeMobile}>
            {lang === 'fr' ? 'Pourquoi' : 'Why'}
          </a>
          <a href="#author" className="text-sm font-medium text-gray-700 hover:text-black" onClick={closeMobile}>
            {lang === 'fr' ? 'Auteur' : 'Author'}
          </a>
          <a href="#about" className="text-sm font-medium text-gray-700 hover:text-black" onClick={closeMobile}>
            {lang === 'fr' ? 'À propos' : 'About'}
          </a>
          <a href="#learn" className="text-sm font-medium text-gray-700 hover:text-black" onClick={closeMobile}>
            {lang === 'fr' ? 'Apprentissages' : 'Learn'}
          </a>
          <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-black" onClick={closeMobile}>
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-50 md:hidden"
            aria-label={mobileOpen ? (lang === 'fr' ? 'Fermer le menu' : 'Close menu') : (lang === 'fr' ? 'Ouvrir le menu' : 'Open menu')}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <span className="text-xl leading-none">×</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
              </svg>
            )}
          </button>
          <LangToggle lang={lang} setLang={setLang} />
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); onOpenPreorder?.(); }}
            className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            {strings.nav?.preorder}
          </a>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mx-auto block max-w-6xl px-4 pb-4 sm:px-6 lg:px-8 md:hidden">
          <div className="mt-2 grid gap-2 rounded-2xl border border-black/10 bg-white p-3">
            <a href="#why" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{lang === 'fr' ? 'Pourquoi' : 'Why'}</a>
            <a href="#author" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{lang === 'fr' ? 'Auteur' : 'Author'}</a>
            <a href="#about" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{lang === 'fr' ? 'À propos' : 'About'}</a>
            <a href="#learn" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{lang === 'fr' ? 'Apprentissages' : 'Learn'}</a>
            <a href="#faq" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">FAQ</a>
          </div>
        </div>
      )}
    </header>
  )
}

