import { normalizeRichText, richTextToPlainText } from './rich-text.mjs'

export const CONTENT_CATEGORIES = {
  resources: ['pratiquer', 'la-pause', 'mon-leadership', 'cette-semaine', 'vue-ailleurs', 'a-observer'],
  media: ['podcasts', 'videos', 'interviews', 'conferences', 'presse'],
}

export const EXTERNAL_SPOTLIGHT_CATEGORIES = ['cette-semaine', 'vue-ailleurs', 'a-observer']

const limits = { title: 180, description: 600, body: 30000, href: 2048 }
const invalidBrand = /Zonzerigué|DS\s+(?:Zonzerigue\s+Leadership\s+International|ZLI)\b/iu

export function validateEntry(entry) {
  if (!entry || !Number.isSafeInteger(entry.revision) || entry.revision < 0) throw new Error('Invalid content revision.')
  if (typeof entry.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(entry.id)) throw new Error('Each entry must have a valid ID.')
  if (!Object.hasOwn(CONTENT_CATEGORIES, entry.type) || !CONTENT_CATEGORIES[entry.type].includes(entry.category)) throw new Error('Choose a valid content category.')
  if (!['draft', 'published'].includes(entry.status)) throw new Error('Choose draft or published status.')
  const spotlightOnly = entry.spotlightOnly === true
  if (spotlightOnly && (entry.type !== 'resources' || !EXTERNAL_SPOTLIGHT_CATEGORIES.includes(entry.category))) throw new Error('Choose a valid spotlight category.')
  const translations = {}
  for (const lang of ['fr', 'en']) {
    const source = entry.translations?.[lang] || {}
    const translation = {}
    if (!spotlightOnly && source.bodyRich != null) translation.bodyRich = normalizeRichText(source.bodyRich)
    for (const [field, limit] of Object.entries(limits)) {
      const value = field === 'body' && spotlightOnly ? '' : field === 'body' && translation.bodyRich ? richTextToPlainText(translation.bodyRich) : source[field] ?? ''
      if (typeof value !== 'string' || value.length > limit) throw new Error(`${lang.toUpperCase()}: ${field} must be text with at most ${limit} characters.`)
      translation[field] = value.trim()
      if (field !== 'href' && invalidBrand.test(value)) throw new Error('Use Zonzerigue without an accent and Zonzerigue Leadership International (ZLI) for the organization.')
    }
    if (translation.href) {
      let url
      try { url = new URL(translation.href) } catch { throw new Error(`${lang.toUpperCase()}: enter a valid https:// link.`) }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error(`${lang.toUpperCase()}: only public HTTP or HTTPS links are allowed.`)
    }
    if (entry.status === 'published' && Object.keys(limits).some((field) => translation[field])) {
      if (spotlightOnly) {
        if (!translation.title || !translation.href) throw new Error(`${lang.toUpperCase()}: un spotlight publié nécessite un titre et une URL. / A published spotlight needs a headline and URL.`)
      } else {
        if (!translation.title || !translation.description) throw new Error(`${lang.toUpperCase()}: a published translation needs a title and summary.`)
        if (!translation.body && !translation.href) throw new Error(`${lang.toUpperCase()}: add article text or a link before publishing.`)
        if (entry.type === 'media' && !translation.href) throw new Error(`${lang.toUpperCase()}: add the media link before publishing.`)
      }
    }
    translations[lang] = translation
  }
  if (!Object.values(translations).some((translation) => translation.title)) throw new Error('Add a title in at least one language.')
  return { id: entry.id, revision: entry.revision, type: entry.type, category: entry.category, status: entry.status, featured: spotlightOnly || entry.featured === true, ...(spotlightOnly ? { spotlightOnly: true } : {}), translations }
}

export function publishedContent(document) {
  return {
    entries: document.entries.filter((entry) => entry.status === 'published').map(({ id, type, category, featured, spotlightOnly, translations }) => ({
      id, type, category, featured,
      ...(spotlightOnly ? { spotlightOnly: true } : {}),
      translations: Object.fromEntries(Object.entries(translations).filter(([, value]) => value.title && (spotlightOnly ? value.href : value.description && (value.body || value.href)))),
    })),
  }
}
