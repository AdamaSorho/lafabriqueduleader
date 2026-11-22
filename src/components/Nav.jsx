import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../utils/tracking'
import { nexusUrl } from '../hub-content'
import PageLink from './PageLink'
import NewsTicker from './NewsTicker'

const logo = '/assets/images/zli-logo-256.webp'

export default function Nav({ lang, setLang, strings, onNavigate, currentPage, hub }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const headerRef = useRef(null)
  const menuButtonRef = useRef(null)
  const copy = hub.nav
  const groups = [
    {
      id: 'book', label: copy.book, page: 'home',
      links: [
        { label: copy.why, hash: '#why' }, { label: copy.author, hash: '#author' },
        { label: copy.about, hash: '#about' }, { label: copy.learn, hash: '#learn' },
        { label: 'FAQ', hash: '#faq' },
      ],
    },
    {
      id: 'resources', label: copy.resources, page: 'resources',
      links: [{ label: copy.allResources }, ...hub.resources.groups.filter((group) => hub.resources.entries.some((entry) => group.categoryIds.includes(entry.category))).map((item) => ({ label: item.title, hash: `#${item.id}` }))],
    },
    {
      id: 'media', label: copy.media, page: 'media',
      links: [{ label: copy.allMedia }, ...hub.media.categories.filter((category) => hub.media.entries.some((entry) => entry.category === category.id)).map((item) => ({ label: item.title, hash: `#${item.id}` }))],
    },
    {
      id: 'beyond', label: strings.nav.beyond, page: 'beyond',
      links: [{ label: copy.allBeyond }, ...strings.beyond.sections.map((item) => ({ label: item.title, hash: `#${item.id}` }))],
    },
  ]

  useEffect(() => {
    const header = headerRef.current
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`)
    })
    observer.observe(header)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--site-header-height')
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen && !openGroup) return
    const closeOutside = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setMobileOpen(false)
        setOpenGroup(null)
      }
    }
    const onEscape = (event) => {
      if (event.key !== 'Escape') return
      if (openGroup) {
        headerRef.current?.querySelector(`#nav-${openGroup}-trigger`)?.focus()
        setOpenGroup(null)
      } else {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [mobileOpen, openGroup])

  const navigate = (page, options) => {
    setMobileOpen(false)
    setOpenGroup(null)
    onNavigate(page, page === 'media' && !options?.hash?.startsWith('#entry-') ? { ...options, mediaQuery: {} } : options)
  }

  return (
    <header ref={headerRef} className="site-header">
      <a className="skip-link" href="#main-content">{lang === 'fr' ? 'Aller au contenu' : 'Skip to content'}</a>
      <nav className="site-nav" aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
        <PageLink page="home" lang={lang} onNavigate={navigate} className="site-brand" aria-label={`${strings.hero.brand} — ${copy.home}`}>
          <img src={logo} alt="" width="256" height="256" />
          <span>{strings.hero.brand}</span>
        </PageLink>
        <div id="primary-navigation" className={`nav-links ${mobileOpen ? 'is-open' : ''}`}>
          {groups.map((group) => (
            <div
              key={group.id}
              className="nav-group"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenGroup((current) => current === group.id ? null : current)
              }}
            >
              <button
                id={`nav-${group.id}-trigger`}
                type="button"
                className={`nav-trigger ${currentPage === group.page ? 'is-current' : ''}`}
                aria-expanded={openGroup === group.id}
                aria-controls={`nav-${group.id}-links`}
                onClick={() => setOpenGroup((current) => current === group.id ? null : group.id)}
              >
                {group.label}<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
              <div id={`nav-${group.id}-links`} className="nav-dropdown" hidden={openGroup !== group.id}>
                {group.links.map((link) => (
                  <PageLink key={link.hash || 'all'} page={group.page} hash={link.hash} lang={lang} onNavigate={navigate} aria-current={currentPage === group.page && !link.hash ? 'page' : undefined}>
                    {link.label}
                  </PageLink>
                ))}
              </div>
            </div>
          ))}
          <PageLink page="home" hash="#contact" lang={lang} onNavigate={navigate} className="nav-contact">Contact</PageLink>
          {nexusUrl ? (
            <a href={nexusUrl} className="nav-nexus">{copy.nexus}<span aria-hidden="true">↗</span></a>
          ) : (
            <span className="nav-nexus is-unavailable">{copy.nexus}<span className="nav-soon">{copy.soon}</span></span>
          )}
        </div>
        <div className="nav-actions">
          <div className="language-toggle" role="group" aria-label={lang === 'fr' ? 'Langue' : 'Language'}>
            {['fr', 'en'].map((locale) => (
              <button key={locale} type="button" lang={locale} aria-label={locale === 'fr' ? 'Français' : 'English'} aria-pressed={lang === locale} onClick={() => { setMobileOpen(false); setOpenGroup(null); setLang(locale) }}>
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
          <PageLink page="home" hash="#commander" lang={lang} onNavigate={navigate} onClick={() => trackEvent('order_navigation_click', { source: 'nav' })} className="nav-order">
            {strings.nav.preorder}
          </PageLink>
          <button ref={menuButtonRef} type="button" className="nav-menu-toggle" aria-label={mobileOpen ? copy.close : copy.menu} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => { setMobileOpen((value) => !value); setOpenGroup(null) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {mobileOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>
      <NewsTicker copy={hub.ticker} lang={lang} onNavigate={navigate} />
    </header>
  )
}
