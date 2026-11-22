import { readResourceLocation } from './resource-catalog.js'

export const MEDIA_PAGE_SIZE = 6

export function readMediaLocation(search = '', hash = '') {
  return { ...readResourceLocation(search, hash), format: new URLSearchParams(search).get('format') || '' }
}

export function setMediaQuery(url, query = {}) {
  for (const key of ['format', 'q', 'page']) url.searchParams.delete(key)
  if (query.format) url.searchParams.set('format', query.format)
  if (query.query?.trim()) url.searchParams.set('q', query.query.trim().slice(0, 120))
  if (Number.isSafeInteger(query.page) && query.page > 1) url.searchParams.set('page', String(query.page))
}

const searchable = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function buildMediaCatalog(copy, location) {
  const entries = copy.entries.filter(entry => !entry.spotlightOnly)
  const populated = new Set(entries.map(entry => entry.category))
  const formats = copy.categories.filter(category => populated.has(category.id))
  const requested = copy.categories.some(category => category.id === location.fragment) ? location.fragment : location.format
  const format = formats.find(category => category.id === requested)?.id || ''
  const terms = searchable(location.query).trim().split(/\s+/).filter(Boolean)
  const filtered = entries.filter(entry => {
    if (format && entry.category !== format) return false
    const text = searchable(`${entry.title} ${entry.description} ${entry.body || ''}`)
    return terms.every(term => text.includes(term))
  })
  const pages = Math.max(1, Math.ceil(filtered.length / MEDIA_PAGE_SIZE))
  const page = Math.min(Math.max(1, Number.isSafeInteger(location.page) ? location.page : 1), pages)
  const offset = (page - 1) * MEDIA_PAGE_SIZE
  return {
    formats, format, query: location.query, page, pages, total: filtered.length,
    available: entries.length, first: filtered.length ? offset + 1 : 0,
    last: Math.min(offset + MEDIA_PAGE_SIZE, filtered.length),
    entries: filtered.slice(offset, offset + MEDIA_PAGE_SIZE),
  }
}
