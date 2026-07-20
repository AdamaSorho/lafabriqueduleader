export const SITE_URL = 'https://lafabriqueduleader.com'

export const PAGE_PATHS = {
  home: {
    fr: '/',
    en: '/en/',
  },
  beyond: {
    fr: '/au-dela-du-livre/',
    en: '/beyond-the-book/',
  },
}

const SOCIAL_IMAGE_PATHS = {
  fr: '/assets/images/la-fabrique-du-leader-social-1200x630.jpg',
  en: '/assets/images/the-leaders-inner-forge-social-1200x630.jpg',
}

const SEO_COPY = {
  fr: {
    home: {
      title: 'La Fabrique du Leader | Livre de DS Zonzerigue',
      description: 'Découvrez La Fabrique du Leader de DS Zonzerigue, un guide pour développer un leadership lucide, aligné et profondément humain. Commandez le livre.',
      imageAlt: 'DS Zonzerigue, auteur de La Fabrique du Leader',
    },
    beyond: {
      title: 'Au-delà du livre | La Fabrique du Leader',
      description: 'Découvrez les masterclass, ateliers, conférences et parcours de lecture guidée proposés autour de La Fabrique du Leader par ZLI.',
      imageAlt: 'Les expériences proposées autour de La Fabrique du Leader',
    },
  },
  en: {
    home: {
      title: 'The Leader’s Inner Forge | Book by DS Zonzerigue',
      description: 'Discover The Leader’s Inner Forge by DS Zonzerigue, a transformational guide to building lucid, grounded, and deeply human leadership.',
      imageAlt: 'DS Zonzerigue, author of The Leader’s Inner Forge',
    },
    beyond: {
      title: 'Beyond the Book | The Leader’s Inner Forge',
      description: 'Explore masterclasses, workshops, keynotes, and guided reading journeys built around The Leader’s Inner Forge by ZLI.',
      imageAlt: 'Experiences built around The Leader’s Inner Forge',
    },
  },
}

export const STATIC_ROUTES = [
  { page: 'home', lang: 'fr', path: '/', output: 'index.html' },
  { page: 'home', lang: 'en', path: '/en/', output: 'en/index.html' },
  { page: 'beyond', lang: 'fr', path: '/au-dela-du-livre/', output: 'au-dela-du-livre/index.html' },
  { page: 'beyond', lang: 'en', path: '/beyond-the-book/', output: 'beyond-the-book/index.html' },
]

export function normalizeLang(value) {
  return String(value || '').toLowerCase().startsWith('en') ? 'en' : 'fr'
}

export function getLocalizedPath(page, lang) {
  const pageKey = page === 'beyond' ? 'beyond' : 'home'
  return PAGE_PATHS[pageKey][normalizeLang(lang)]
}

export function getRouteContext(pathname, fallbackLang = 'fr') {
  const path = `/${String(pathname || '/').replace(/^\/+|\/+$/g, '')}`

  if (path === '/au-dela-du-livre') return { page: 'beyond', lang: 'fr' }
  if (path === '/beyond-the-book') return { page: 'beyond', lang: 'en' }
  if (path === '/en') return { page: 'home', lang: 'en' }
  if (path === '/') return { page: 'home', lang: 'fr' }

  return { page: 'home', lang: normalizeLang(fallbackLang) }
}

function absoluteUrl(path) {
  return new URL(path, SITE_URL).toString()
}

function buildStructuredData(page, lang, canonicalUrl) {
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Zonzerigue Leadership International',
    alternateName: 'ZLI',
    url: 'https://zonzerigueleadership.com/',
  }
  const author = {
    '@type': 'Person',
    '@id': `${SITE_URL}/#author`,
    name: 'DS Zonzerigue',
  }

  const graph = [organization, author]
  if (page === 'home') {
    graph.push({
      '@type': 'Book',
      '@id': `${SITE_URL}/#book`,
      name: lang === 'en' ? 'The Leader’s Inner Forge' : 'La Fabrique du Leader',
      alternateName: lang === 'en' ? 'La Fabrique du Leader' : 'The Leader’s Inner Forge',
      inLanguage: lang,
      author: { '@id': author['@id'] },
      publisher: { '@id': organization['@id'] },
      url: canonicalUrl,
      image: absoluteUrl(SOCIAL_IMAGE_PATHS[lang]),
    })
  } else {
    graph.push({
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: SEO_COPY[lang][page].title,
      description: SEO_COPY[lang][page].description,
      inLanguage: lang,
      url: canonicalUrl,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#book` },
    })
  }
  graph.push({
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'La Fabrique du Leader',
    url: SITE_URL,
    inLanguage: ['fr', 'en'],
    publisher: { '@id': organization['@id'] },
  })

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function getSeo(page, lang) {
  const pageKey = page === 'beyond' ? 'beyond' : 'home'
  const locale = normalizeLang(lang)
  const copy = SEO_COPY[locale][pageKey]
  const canonicalPath = getLocalizedPath(pageKey, locale)
  const canonicalUrl = absoluteUrl(canonicalPath)

  return {
    ...copy,
    page: pageKey,
    lang: locale,
    locale: locale === 'en' ? 'en_US' : 'fr_FR',
    alternateLocale: locale === 'en' ? 'fr_FR' : 'en_US',
    canonicalPath,
    canonicalUrl,
    frenchUrl: absoluteUrl(getLocalizedPath(pageKey, 'fr')),
    englishUrl: absoluteUrl(getLocalizedPath(pageKey, 'en')),
    imageUrl: absoluteUrl(SOCIAL_IMAGE_PATHS[locale]),
    structuredData: buildStructuredData(pageKey, locale, canonicalUrl),
  }
}

function setMeta(selector, value) {
  const element = document.head.querySelector(selector)
  if (element) element.setAttribute('content', value)
}

export function applyDocumentSeo(page, lang) {
  if (typeof document === 'undefined') return

  const seo = getSeo(page, lang)
  document.documentElement.lang = seo.lang
  document.documentElement.dataset.page = seo.page
  document.documentElement.dataset.lang = seo.lang
  document.title = seo.title

  setMeta('meta[name="description"]', seo.description)
  setMeta('meta[property="og:title"]', seo.title)
  setMeta('meta[property="og:description"]', seo.description)
  setMeta('meta[property="og:url"]', seo.canonicalUrl)
  setMeta('meta[property="og:locale"]', seo.locale)
  setMeta('meta[property="og:locale:alternate"]', seo.alternateLocale)
  setMeta('meta[property="og:image"]', seo.imageUrl)
  setMeta('meta[property="og:image:alt"]', seo.imageAlt)
  setMeta('meta[name="twitter:title"]', seo.title)
  setMeta('meta[name="twitter:description"]', seo.description)
  setMeta('meta[name="twitter:image"]', seo.imageUrl)
  setMeta('meta[name="twitter:image:alt"]', seo.imageAlt)

  const canonical = document.head.querySelector('link[rel="canonical"]')
  if (canonical) canonical.href = seo.canonicalUrl
  const frenchAlternate = document.head.querySelector('link[rel="alternate"][hreflang="fr"]')
  if (frenchAlternate) frenchAlternate.href = seo.frenchUrl
  const englishAlternate = document.head.querySelector('link[rel="alternate"][hreflang="en"]')
  if (englishAlternate) englishAlternate.href = seo.englishUrl
  const defaultAlternate = document.head.querySelector('link[rel="alternate"][hreflang="x-default"]')
  if (defaultAlternate) defaultAlternate.href = seo.frenchUrl

  const structuredData = document.getElementById('structured-data')
  if (structuredData) structuredData.textContent = JSON.stringify(seo.structuredData)
}
