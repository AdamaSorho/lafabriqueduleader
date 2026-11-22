import { useEffect, useMemo, useRef, useState } from 'react'
import { getLocalizedPath } from '../seo'
import { buildResourceCatalog, readResourceLocation, resourcePageNumbers, resourceReadingMinutes, setResourceQuery } from '../utils/resource-catalog'
import { safeEditorialUrl } from '../../shared/rich-text.mjs'
import RichTextContent from './RichTextContent'

function CatalogLink({ query, hash = '', lang, onNavigate, children, ...props }) {
  const url = new URL(getLocalizedPath('resources', lang), 'https://lafabriqueduleader.com')
  setResourceQuery(url, query)
  url.hash = hash
  return <a {...props} href={`${url.pathname}${url.search}${url.hash}`} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate('resources', { hash, resourceQuery: query })
  }}>{children}</a>
}

export default function ResourceLibrary({ copy, lang, status, onRetry, onNavigate, navigationVersion }) {
  const t = (fr, en) => lang === 'fr' ? fr : en
  const [location, setLocation] = useState(() => readResourceLocation())
  const [hydrated, setHydrated] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const resultsRef = useRef(null)
  const resultsHeadingRef = useRef(null)
  const readerHeadingRef = useRef(null)
  const lastScroll = useRef(null)

  useEffect(() => {
    const read = () => {
      const next = readResourceLocation(window.location.search, window.location.hash)
      setLocation((current) => current.key === next.key ? current : next)
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
  const catalog = useMemo(() => buildResourceCatalog(copy, location), [copy, location])
  const entry = location.entryId ? copy.entries.find((item) => item.id === location.entryId) : null
  const query = { group: catalog.group, topic: catalog.topic, query: catalog.query, page: catalog.page }
  const category = entry ? copy.categories.find((item) => item.id === entry.category) : null
  const group = entry ? copy.groups.find((item) => item.categoryIds.includes(entry.category)) : null
  const readTime = (item) => {
    const minutes = resourceReadingMinutes(item)
    return minutes ? `${minutes} ${t('min de lecture', 'min read')}` : t('Lecture externe', 'External reading')
  }

  useEffect(() => {
    if (!hydrated || status === 'loading') return
    const key = `${lang}:${location.key}:${location.entryId ? entry?.id || status : 'catalog'}`
    if (lastScroll.current === key) return
    const frame = requestAnimationFrame(() => {
      const previous = lastScroll.current
      lastScroll.current = key
      if (location.entryId) {
        window.scrollTo({ top: 0, behavior: 'instant' })
        readerHeadingRef.current?.focus({ preventScroll: true })
      } else if (location.fragment || location.query || location.group || location.topic || location.page > 1) {
        resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
        if (previous) resultsHeadingRef.current?.focus({ preventScroll: true })
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrated, location, lang, status, entry?.id])

  const changeSelection = (changes) => onNavigate('resources', { hash: '#ressources-liste', resourceQuery: { ...query, page: 1, ...changes } })
  const alert = status === 'error' ? <div className="resource-alert" role="alert"><p>{t('Les ressources ne peuvent pas être actualisées pour le moment.', 'Resources cannot be refreshed right now.')}</p><button type="button" onClick={onRetry}>{t('Réessayer', 'Try again')}</button></div> : null

  if (location.entryId) {
    const sourceUrl = safeEditorialUrl(entry?.href)
    return (
      <div className="resource-reader">
        <div className="resource-library-container">
          <CatalogLink query={query} hash="#ressources-liste" lang={lang} onNavigate={onNavigate} className="resource-back">{t('Retour aux ressources', 'Back to resources')}</CatalogLink>
          {alert}
          {entry ? <article id={`entry-${entry.id}`}>
            <header className="resource-reader-header">
              <p className="resource-eyebrow">{group?.title}</p>
              <h1 ref={readerHeadingRef} tabIndex={-1}>{entry.title}</h1>
              <div className="resource-reader-meta"><span>{category?.title}</span><span>{readTime(entry)}</span></div>
              <p className="resource-reader-summary">{entry.description}</p>
            </header>
            {entry.body && <RichTextContent document={entry.bodyRich} text={entry.body} headingLevel={2} />}
            {sourceUrl && <a className="resource-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{t('Consulter la source', 'Read the source')}<span className="sr-only">{t(' — ouvre un nouvel onglet', ' — opens a new tab')}</span></a>}
            <div className="resource-reader-end"><CatalogLink query={query} hash="#ressources-liste" lang={lang} onNavigate={onNavigate}>{t('Continuer à explorer les ressources', 'Explore more resources')}</CatalogLink></div>
          </article> : <section className="resource-state" aria-live="polite">
            <h1 ref={readerHeadingRef} tabIndex={-1}>{status === 'loading' ? t('Chargement de la ressource…', 'Loading resource…') : status === 'error' ? t('Lecture indisponible pour le moment', 'Reading is temporarily unavailable') : t('Cette ressource n’est plus disponible', 'This resource is no longer available')}</h1>
            {status === 'ready' && <p>{t('Elle a peut-être été retirée ou n’est pas proposée dans cette langue. Retrouvez les autres ressources dans la bibliothèque.', 'It may have been removed or may not be available in this language. Browse the library for other resources.')}</p>}
          </section>}
        </div>
      </div>
    )
  }

  return (
    <div className="resource-library">
      <section className="resource-library-hero">
        <div className="resource-library-container">
          <p className="resource-eyebrow">{t('La Fabrique · Ressources', 'La Fabrique · Resources')}</p>
          <h1>{t('Une idée à lire. Un pas à faire.', 'An idea to explore. A step to take.')}</h1>
          <p>{t('Des exercices, des réflexions et des regards sur le leadership. Trouvez la ressource qui répond à votre besoin du moment.', 'Exercises, reflections, and perspectives on leadership. Find the resource that meets you where you are today.')}</p>
        </div>
      </section>
      <section ref={resultsRef} id="ressources-liste" className="resource-catalog resource-library-container" aria-labelledby="resource-results-heading">
        {alert}
        {catalog.available > 0 && <>
          <nav className="resource-theme-filters" aria-label={t('Filtrer par thème', 'Filter by theme')}>
            <CatalogLink query={{ query: catalog.query, page: 1 }} hash="#ressources-liste" lang={lang} onNavigate={onNavigate} aria-current={!catalog.group ? 'true' : undefined}>{t('Toutes les ressources', 'All resources')}</CatalogLink>
            {catalog.groups.map((item) => <CatalogLink key={item.id} query={{ group: item.id, query: catalog.query, page: 1 }} hash="#ressources-liste" lang={lang} onNavigate={onNavigate} aria-current={catalog.group === item.id ? 'true' : undefined}>{item.title}</CatalogLink>)}
          </nav>
          <div className="resource-tools">
            <form className="resource-search" role="search" onSubmit={(event) => { event.preventDefault(); changeSelection({ query: searchDraft }) }}>
              <label className="sr-only" htmlFor="resource-search">{t('Rechercher une ressource', 'Search resources')}</label>
              <input id="resource-search" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={120} placeholder={t('Un sujet, une question…', 'A topic, a question…')} />
              <button type="submit">{t('Rechercher', 'Search')}</button>
            </form>
            {catalog.topics.length > 0 && <div className="resource-topic-filter">
              <label htmlFor="resource-topic">{t('Sujet', 'Topic')}</label>
              <select id="resource-topic" value={catalog.topic} onChange={(event) => {
                const topic = event.target.value
                const group = topic ? copy.groups.find((item) => item.categoryIds.includes(topic))?.id || '' : catalog.group
                changeSelection({ topic, group })
              }}>
                <option value="">{t('Tous les sujets', 'All topics')}</option>
                {catalog.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
              </select>
            </div>}
          </div>
        </>}
        <div className="resource-results-heading">
          <h2 id="resource-results-heading" ref={resultsHeadingRef} tabIndex={-1}>{t('À explorer', 'Explore the library')}</h2>
          {status !== 'loading' && catalog.available > 0 && <p role="status">{catalog.total ? `${catalog.first}–${catalog.last} ${t('sur', 'of')} ${catalog.total} ${t(catalog.total === 1 ? 'ressource' : 'ressources', catalog.total === 1 ? 'resource' : 'resources')}` : t('Aucun résultat', 'No results')}</p>}
        </div>
        {(catalog.group || catalog.topic || catalog.query) && <div className="resource-active-filters">
          {catalog.query && <span>{t('Recherche', 'Search')} : « {catalog.query} »</span>}
          <CatalogLink query={{}} hash="#ressources-liste" lang={lang} onNavigate={onNavigate}>{t('Effacer les filtres', 'Clear filters')}</CatalogLink>
        </div>}
        {catalog.entries.length ? <>
          <div className="resource-card-grid">
            {catalog.entries.map((item) => {
              const topic = copy.categories.find((category) => category.id === item.category)
              const theme = copy.groups.find((group) => group.categoryIds.includes(item.category))
              return <article key={item.id} className="resource-card" data-theme={theme?.id}>
                <CatalogLink query={query} hash={`#entry-${item.id}`} lang={lang} onNavigate={onNavigate} aria-labelledby={`resource-title-${item.id}`}>
                  <div className="resource-card-meta"><span>{topic?.title}</span><span>{readTime(item)}</span></div>
                  <h3 id={`resource-title-${item.id}`}>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="resource-card-action">{t('Lire la ressource', 'Read resource')}</span>
                </CatalogLink>
              </article>
            })}
          </div>
          {catalog.pages > 1 && <nav className="resource-pagination" aria-label={t('Pages des ressources', 'Resource pages')}>
            {catalog.page > 1 ? <CatalogLink query={{ ...query, page: catalog.page - 1 }} hash="#ressources-liste" lang={lang} onNavigate={onNavigate}>{t('Précédent', 'Previous')}</CatalogLink> : <span aria-disabled="true">{t('Précédent', 'Previous')}</span>}
            <div>{resourcePageNumbers(catalog.page, catalog.pages).map((number, index) => number === null ? <span key={`gap-${index}`} aria-hidden="true">…</span> : <CatalogLink key={number} query={{ ...query, page: number }} hash="#ressources-liste" lang={lang} onNavigate={onNavigate} aria-label={`${t('Page', 'Page')} ${number}`} aria-current={number === catalog.page ? 'page' : undefined}>{number}</CatalogLink>)}</div>
            {catalog.page < catalog.pages ? <CatalogLink query={{ ...query, page: catalog.page + 1 }} hash="#ressources-liste" lang={lang} onNavigate={onNavigate}>{t('Suivant', 'Next')}</CatalogLink> : <span aria-disabled="true">{t('Suivant', 'Next')}</span>}
          </nav>}
        </> : status === 'loading' ? <div className="resource-state" role="status"><p>{t('Chargement des ressources…', 'Loading resources…')}</p></div> : status !== 'error' ? <div className="resource-state">
          <h3>{catalog.available ? t('Essayez un autre sujet.', 'Try another topic.') : t('Les premières ressources arrivent bientôt.', 'The first resources are coming soon.')}</h3>
          <p>{catalog.available ? t('Aucune ressource ne correspond à cette recherche. Modifiez vos mots-clés ou élargissez votre sélection.', 'No resources match this search. Change your keywords or broaden your selection.') : t('Vous retrouverez ici des lectures et des exercices pour nourrir votre leadership.', 'You’ll find reading and exercises here to support your leadership practice.')}</p>
          {catalog.available > 0 && <CatalogLink query={{}} hash="#ressources-liste" lang={lang} onNavigate={onNavigate}>{t('Voir toutes les ressources', 'View all resources')}</CatalogLink>}
        </div> : null}
      </section>
    </div>
  )
}
