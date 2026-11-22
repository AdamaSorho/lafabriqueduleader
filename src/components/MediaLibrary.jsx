import { useEffect, useMemo, useRef, useState } from 'react'
import { getLocalizedPath } from '../seo'
import { buildMediaCatalog, readMediaLocation, setMediaQuery } from '../utils/media-catalog'
import { resourcePageNumbers } from '../utils/resource-catalog'
import { safeEditorialUrl } from '../../shared/rich-text.mjs'
import { parseYouTubeUrl } from '../utils/youtube'
import RichTextContent from './RichTextContent'
import YouTubeVideo from './YouTubeVideo'
import MediaArtwork, { MediaFormatIcon } from './MediaArtwork'

function MediaLink({ query, hash = '', lang, onNavigate, children, ...props }) {
  const url = new URL(getLocalizedPath('media', lang), 'https://lafabriqueduleader.com')
  setMediaQuery(url, query)
  url.hash = hash
  return <a {...props} href={`${url.pathname}${url.search}${url.hash}`} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate('media', { hash, mediaQuery: query })
  }}>{children}</a>
}

function providerName(entry) {
  if (parseYouTubeUrl(entry.href)) return 'YouTube'
  const href = safeEditorialUrl(entry.href)
  return href ? new URL(href).hostname.replace(/^www\./, '') : ''
}

export default function MediaLibrary({ copy, lang, status, onRetry, onNavigate, navigationVersion }) {
  const t = (fr, en) => lang === 'fr' ? fr : en
  const [location, setLocation] = useState(() => readMediaLocation())
  const [hydrated, setHydrated] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const resultsRef = useRef(null)
  const resultsHeadingRef = useRef(null)
  const detailHeadingRef = useRef(null)
  const lastScroll = useRef(null)

  useEffect(() => {
    const read = () => {
      const next = readMediaLocation(window.location.search, window.location.hash)
      setLocation(current => current.key === next.key ? current : next)
      setHydrated(true)
    }
    read()
    window.addEventListener('popstate', read)
    window.addEventListener('hashchange', read)
    return () => {
      window.removeEventListener('popstate', read)
      window.removeEventListener('hashchange', read)
    }
  }, [navigationVersion, lang])
  useEffect(() => { setSearchDraft(location.query) }, [location.query])

  const catalog = useMemo(() => buildMediaCatalog(copy, location), [copy, location])
  const entry = location.entryId ? copy.entries.find(item => item.id === location.entryId) : null
  const query = { format: catalog.format, query: catalog.query, page: catalog.page }
  const format = entry ? copy.categories.find(item => item.id === entry.category) : null
  const actionFor = (item) => parseYouTubeUrl(item.href) || item.category === 'videos' ? t('Voir la vidéo', 'Watch video') : item.category === 'podcasts' ? t('Découvrir le podcast', 'Explore podcast') : item.category === 'presse' ? t('Lire l’article', 'Read article') : t('Découvrir le média', 'Explore media')

  useEffect(() => {
    if (!hydrated || status === 'loading') return
    const key = `${lang}:${location.key}:${location.entryId ? entry?.id || status : 'catalog'}`
    if (lastScroll.current === key) return
    const frame = requestAnimationFrame(() => {
      const previous = lastScroll.current
      lastScroll.current = key
      if (location.entryId) {
        window.scrollTo({ top: 0, behavior: 'instant' })
        detailHeadingRef.current?.focus({ preventScroll: true })
      } else if (location.fragment || location.query || location.format || location.page > 1) {
        resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
        if (previous) resultsHeadingRef.current?.focus({ preventScroll: true })
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrated, location, lang, status, entry?.id])

  const alert = status === 'error' ? <div className="resource-alert" role="alert"><p>{t('La médiathèque ne peut pas être actualisée pour le moment.', 'The media library cannot be refreshed right now.')}</p><button type="button" onClick={onRetry}>{t('Réessayer', 'Try again')}</button></div> : null

  if (location.entryId) {
    const sourceUrl = safeEditorialUrl(entry?.href)
    const hasVideo = Boolean(parseYouTubeUrl(entry?.href))
    return <div className="media-detail resource-reader">
      <div className="resource-library-container">
        <MediaLink query={query} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate} className="resource-back">{t('Retour à la médiathèque', 'Back to the media library')}</MediaLink>
        {alert}
        {entry ? <article id={`entry-${entry.id}`}>
          <header className="resource-reader-header">
            <p className="resource-eyebrow">{format?.title}</p>
            <h1 ref={detailHeadingRef} tabIndex={-1}>{entry.title}</h1>
            {providerName(entry) && <div className="resource-reader-meta"><span>{providerName(entry)}</span></div>}
            <p className="resource-reader-summary">{entry.description}</p>
          </header>
          {hasVideo ? <YouTubeVideo key={entry.id} href={entry.href} title={entry.title} lang={lang} /> : sourceUrl ? <div className="media-source-panel" data-format={entry.category}>
            <MediaFormatIcon format={entry.category} />
            <div><p>{t('Disponible sur', 'Available on')} <strong>{providerName(entry)}</strong></p><a href={sourceUrl} target="_blank" rel="noopener noreferrer">{actionFor(entry)}<span className="sr-only">{t(' — ouvre un nouvel onglet', ' — opens a new tab')}</span></a></div>
          </div> : <p className="resource-alert">{t('Le lien de ce média n’est pas disponible pour le moment.', 'This media link is currently unavailable.')}</p>}
          {entry.body && <section className="media-detail-notes" aria-label={t('À propos de ce média', 'About this media')}><RichTextContent document={entry.bodyRich} text={entry.body} headingLevel={2} /></section>}
          <div className="resource-reader-end"><MediaLink query={query} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate}>{t('Continuer à explorer la médiathèque', 'Explore more media')}</MediaLink></div>
        </article> : <section className="resource-state" aria-live="polite">
          <h1 ref={detailHeadingRef} tabIndex={-1}>{status === 'loading' ? t('Chargement du média…', 'Loading media…') : status === 'error' ? t('Média indisponible pour le moment', 'Media is temporarily unavailable') : t('Ce média n’est plus disponible', 'This media is no longer available')}</h1>
          {status === 'ready' && <p>{t('Il a peut-être été retiré ou n’est pas proposé dans cette langue. Retrouvez les autres contenus dans la médiathèque.', 'It may have been removed or may not be available in this language. Browse the library for other media.')}</p>}
        </section>}
      </div>
    </div>
  }

  return <div className="media-library">
    <section className="resource-library-hero media-library-hero">
      <div className="resource-library-container">
        <p className="resource-eyebrow">{t('La Fabrique · Médiathèque', 'La Fabrique · Media library')}</p>
        <h1>{t('Écouter. Regarder. Aller plus loin.', 'Listen. Watch. Go further.')}</h1>
        <p>{t('Des conversations, des vidéos et des lectures pour nourrir votre leadership. Choisissez un format et prenez le temps de découvrir.', 'Conversations, videos, and reading to enrich your leadership. Choose a format and take time to explore.')}</p>
      </div>
    </section>
    <section ref={resultsRef} id="mediatheque-liste" className="resource-catalog resource-library-container media-catalog" aria-labelledby="media-results-heading">
      {alert}
      {catalog.available > 0 && <>
        <nav className="resource-theme-filters media-format-filters" aria-label={t('Filtrer par format', 'Filter by format')}>
          <MediaLink query={{ query: catalog.query, page: 1 }} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate} aria-current={!catalog.format ? 'true' : undefined}>{t('Tous les médias', 'All media')}</MediaLink>
          {catalog.formats.map(item => <MediaLink key={item.id} query={{ format: item.id, query: catalog.query, page: 1 }} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate} aria-current={catalog.format === item.id ? 'true' : undefined}>{item.title}</MediaLink>)}
        </nav>
        <form className="resource-search media-search" role="search" onSubmit={(event) => { event.preventDefault(); onNavigate('media', { hash: '#mediatheque-liste', mediaQuery: { ...query, query: searchDraft, page: 1 } }) }}>
          <label className="sr-only" htmlFor="media-search">{t('Rechercher dans la médiathèque', 'Search the media library')}</label>
          <input id="media-search" type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} maxLength={120} placeholder={t('Un sujet, une prise de parole…', 'A topic, a conversation…')} />
          <button type="submit">{t('Rechercher', 'Search')}</button>
        </form>
      </>}
      <div className="resource-results-heading">
        <h2 id="media-results-heading" ref={resultsHeadingRef} tabIndex={-1}>{t('À découvrir', 'Discover the library')}</h2>
        {status !== 'loading' && catalog.available > 0 && <p role="status">{catalog.total ? `${catalog.first}–${catalog.last} ${t('sur', 'of')} ${catalog.total} ${t(catalog.total === 1 ? 'média' : 'médias', catalog.total === 1 ? 'item' : 'items')}` : t('Aucun résultat', 'No results')}</p>}
      </div>
      {(catalog.format || catalog.query) && <div className="resource-active-filters">
        {catalog.query && <span>{t('Recherche', 'Search')} : « {catalog.query} »</span>}
        <MediaLink query={{}} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate}>{t('Effacer les filtres', 'Clear filters')}</MediaLink>
      </div>}
      {catalog.entries.length ? <>
        <div className="resource-card-grid media-card-grid">
          {catalog.entries.map(item => <article key={item.id} className="media-card">
            <MediaLink query={query} hash={`#entry-${item.id}`} lang={lang} onNavigate={onNavigate} aria-labelledby={`media-title-${item.id}`}>
              <MediaArtwork entry={item} />
              <div className="media-card-body">
                <div className="resource-card-meta"><span>{copy.categories.find(category => category.id === item.category)?.title}</span><span>{providerName(item)}</span></div>
                <h3 id={`media-title-${item.id}`}>{item.title}</h3>
                <p>{item.description}</p>
                <span className="resource-card-action">{actionFor(item)}</span>
              </div>
            </MediaLink>
          </article>)}
        </div>
        {catalog.pages > 1 && <nav className="resource-pagination media-pagination" aria-label={t('Pages de la médiathèque', 'Media library pages')}>
          {catalog.page > 1 ? <MediaLink query={{ ...query, page: catalog.page - 1 }} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate}>{t('Précédent', 'Previous')}</MediaLink> : <span aria-disabled="true">{t('Précédent', 'Previous')}</span>}
          <div>{resourcePageNumbers(catalog.page, catalog.pages).map((number, index) => number === null ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <MediaLink key={number} query={{ ...query, page: number }} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate} aria-label={`Page ${number}`} aria-current={number === catalog.page ? 'page' : undefined}>{number}</MediaLink>)}</div>
          {catalog.page < catalog.pages ? <MediaLink query={{ ...query, page: catalog.page + 1 }} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate}>{t('Suivant', 'Next')}</MediaLink> : <span aria-disabled="true">{t('Suivant', 'Next')}</span>}
        </nav>}
      </> : status === 'loading' ? <div className="resource-state" role="status"><p>{t('Chargement des médias…', 'Loading media…')}</p></div> : status !== 'error' ? <div className="resource-state">
        <h3>{catalog.available ? t('Essayez un autre sujet.', 'Try another topic.') : t('Les premiers médias arrivent bientôt.', 'The first media items are coming soon.')}</h3>
        <p>{catalog.available ? t('Aucun média ne correspond à cette recherche. Essayez d’autres mots-clés ou un autre format.', 'No media matches this search. Try different keywords or another format.') : t('Vous retrouverez ici les prochaines conversations, vidéos et parutions de La Fabrique.', 'Upcoming conversations, videos, and coverage from La Fabrique will appear here.')}</p>
        {catalog.available > 0 && <MediaLink query={{}} hash="#mediatheque-liste" lang={lang} onNavigate={onNavigate}>{t('Voir toute la médiathèque', 'View all media')}</MediaLink>}
      </div> : null}
    </section>
  </div>
}
