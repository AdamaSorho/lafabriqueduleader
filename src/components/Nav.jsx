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

export default function Nav({ lang, setLang, strings, onOpenPreorder, onNavigate, currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)
  const beyondPath = lang === 'fr' ? '/au-dela-du-livre' : '/beyond-the-book'
  const links = [
    { key: 'why', label: lang === 'fr' ? 'Pourquoi' : 'Why', page: 'home', hash: '#why' },
    { key: 'author', label: lang === 'fr' ? 'Auteur' : 'Author', page: 'home', hash: '#author' },
    { key: 'about', label: lang === 'fr' ? 'À propos' : 'About', page: 'home', hash: '#about' },
    { key: 'learn', label: lang === 'fr' ? 'Apprentissages' : 'Learn', page: 'home', hash: '#learn' },
    { key: 'beyond', label: strings.nav?.beyond || (lang === 'fr' ? 'Au-delà du livre' : 'Beyond the Book'), page: 'beyond' },
    { key: 'faq', label: 'FAQ', page: 'home', hash: '#faq' },
  ]
  const handleNav = (event, link) => {
    if (!onNavigate) return
    event.preventDefault()
    closeMobile()
    onNavigate(link.page, { hash: link.hash })
  }
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src={logo} alt={strings.hero.brand} className="h-7 w-auto" />
          <span className="font-semibold tracking-tight">{strings.hero.brand}</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const href = link.page === 'home' ? link.hash || '/' : beyondPath
            const isActive = link.page === 'beyond' && currentPage === 'beyond'
            return (
              <a
                key={link.key}
                href={href}
                onClick={(event) => handleNav(event, link)}
                className={`text-sm font-medium transition ${isActive ? 'text-black' : 'text-gray-700 hover:text-black'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </a>
            )
          })}
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
            {links.map((link) => {
              const href = link.page === 'home' ? link.hash || '/' : beyondPath
              return (
                <a
                  key={link.key}
                  href={href}
                  onClick={(event) => handleNav(event, link)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {link.label}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
