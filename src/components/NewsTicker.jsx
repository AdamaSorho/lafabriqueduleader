import { useEffect, useState } from 'react'
import PageLink from './PageLink'
import { safeEditorialUrl } from '../../shared/rich-text.mjs'

function SpotlightText({ item }) {
  return (
    <>
      <span className="news-ticker-category">{item.category}</span>
      <span className="news-ticker-title">{item.title}</span>
      <span aria-hidden="true" className="news-ticker-arrow">↗</span>
    </>
  )
}

export default function NewsTicker({ copy, lang, onNavigate }) {
  const [sequence, setSequence] = useState(0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(true)
  const count = copy.items.length

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  if (!count) return null
  const index = ((sequence % count) + count) % count
  const item = copy.items[index]
  const externalHref = safeEditorialUrl(item.href)
  const Link = externalHref ? 'a' : PageLink
  const linkProps = externalHref ? {
    href: externalHref,
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': `${item.category}: ${item.title} — ${lang === 'fr' ? 'ouvre un nouvel onglet' : 'opens a new tab'}`,
  } : { page: item.page || 'resources', hash: item.hash, lang, onNavigate }

  return (
    <aside className="news-ticker" aria-label={copy.label} data-paused={paused || !visible}>
      <div className="news-ticker-inner">
        <p className="news-ticker-label"><span aria-hidden="true" />{copy.label}</p>
        <div className="news-ticker-viewport">
          {/* Reserve the tallest headline's space so the header stays still between spotlights. */}
          {copy.items.map((headline, position) => (
            <div key={position} className="news-ticker-sizer" aria-hidden="true">
              <SpotlightText item={headline} />
            </div>
          ))}
          <Link
            key={`${sequence}-${lang}-${item.title}`}
            {...linkProps}
            className="news-ticker-story"
            onAnimationEnd={(event) => {
              if (event.animationName === 'news-spotlight') setSequence((value) => value + 1)
            }}
            onMouseDown={(event) => {
              // Mouse clicks keep the moving item in place; keyboard focus makes it stationary.
              if (event.button === 0) event.preventDefault()
            }}
          >
            <SpotlightText item={item} />
          </Link>
        </div>
        <div className="news-ticker-controls">
          {count > 1 && <button type="button" aria-label={copy.previous} onClick={() => setSequence((value) => value - 1)}>‹</button>}
          <span className="news-ticker-count" aria-hidden="true">{index + 1} / {count}</span>
          <button type="button" className="news-ticker-pause" aria-label={paused ? copy.play : copy.pause} onClick={() => setPaused((value) => !value)}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              {paused ? <path d="m5 3 8 5-8 5z" /> : <path d="M4 3h3v10H4zm5 0h3v10H9z" />}
            </svg>
          </button>
          {count > 1 && <button type="button" aria-label={copy.next} onClick={() => setSequence((value) => value + 1)}>›</button>}
        </div>
      </div>
    </aside>
  )
}
