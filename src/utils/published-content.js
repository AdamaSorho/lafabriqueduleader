import { hubContent } from '../hub-content.js'
import { safeEditorialUrl } from '../../shared/rich-text.mjs'

export function buildPublishedHub(document, lang) {
  const copy = hubContent[lang]
  const entries = (document?.entries || [])
    .filter((entry) => ['resources', 'media'].includes(entry.type) && entry.translations?.[lang]?.title)
    .map((entry) => ({ ...entry, ...entry.translations[lang] }))
  const headlines = entries.filter((entry) => entry.featured).flatMap((entry) => {
    const headline = {
      category: copy[entry.type].categories.find((category) => category.id === entry.category)?.title,
      title: entry.title,
    }
    if (entry.spotlightOnly) {
      const href = safeEditorialUrl(entry.href)
      return href ? [{ ...headline, href }] : []
    }
    return [{ ...headline, page: entry.type, hash: `#entry-${entry.id}` }]
  })
  return {
    ...copy,
    resources: { ...copy.resources, entries: entries.filter((entry) => entry.type === 'resources' && !entry.spotlightOnly) },
    media: { ...copy.media, entries: entries.filter((entry) => entry.type === 'media' && !entry.spotlightOnly) },
    ticker: { ...copy.ticker, items: headlines.length ? headlines : copy.ticker.items },
  }
}
