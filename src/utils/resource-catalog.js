export const RESOURCE_PAGE_SIZE = 6
export const RESOURCE_QUERY_KEYS = ['group', 'topic', 'q', 'page']

export function readResourceLocation(search = '', hash = '') {
  const params = new URLSearchParams(search)
  let fragment = hash.replace(/^#/, '')
  try { fragment = decodeURIComponent(fragment) } catch { /* Treat malformed links as an unknown selection. */ }
  const value = params.get('page') || '1'
  const page = /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1
  return {
    group: params.get('group') || '', topic: params.get('topic') || '',
    query: (params.get('q') || '').slice(0, 120), page,
    entryId: fragment.startsWith('entry-') ? fragment.slice(6) : '',
    fragment, key: `${search}${hash}`,
  }
}

export function setResourceQuery(url, query = {}) {
  for (const key of RESOURCE_QUERY_KEYS) url.searchParams.delete(key)
  if (query.group) url.searchParams.set('group', query.group)
  if (query.topic) url.searchParams.set('topic', query.topic)
  if (query.query?.trim()) url.searchParams.set('q', query.query.trim().slice(0, 120))
  if (Number.isSafeInteger(query.page) && query.page > 1) url.searchParams.set('page', String(query.page))
}

const searchable = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function buildResourceCatalog(copy, location) {
  const entries = copy.entries.filter((entry) => !entry.spotlightOnly)
  const counts = new Map()
  for (const entry of entries) counts.set(entry.category, (counts.get(entry.category) || 0) + 1)
  const groups = copy.groups.filter((group) => group.categoryIds.some((id) => counts.has(id)))
  let requestedGroup = location.group
  let requestedTopic = location.topic
  if (copy.groups.some((group) => group.id === location.fragment)) {
    requestedGroup = location.fragment
    requestedTopic = ''
  } else if (copy.categories.some((category) => category.id === location.fragment)) {
    requestedTopic = location.fragment
    requestedGroup = copy.groups.find((group) => group.categoryIds.includes(requestedTopic))?.id || ''
  }
  const group = groups.find((group) => group.id === requestedGroup)
  const topics = copy.categories.filter((category) => counts.has(category.id) && (!group || group.categoryIds.includes(category.id)))
  const topic = topics.find((category) => category.id === requestedTopic)
  const terms = searchable(location.query).trim().split(/\s+/).filter(Boolean)
  const filtered = entries.filter((entry) => {
    if (group && !group.categoryIds.includes(entry.category)) return false
    if (topic && entry.category !== topic.id) return false
    const text = searchable(`${entry.title} ${entry.description} ${entry.body || ''}`)
    return terms.every((term) => text.includes(term))
  })
  const pages = Math.max(1, Math.ceil(filtered.length / RESOURCE_PAGE_SIZE))
  const page = Math.min(Math.max(1, Number.isSafeInteger(location.page) ? location.page : 1), pages)
  const offset = (page - 1) * RESOURCE_PAGE_SIZE
  return {
    groups, topics, group: group?.id || '', topic: topic?.id || '',
    query: location.query, page, pages, total: filtered.length, available: entries.length,
    first: filtered.length ? offset + 1 : 0, last: Math.min(offset + RESOURCE_PAGE_SIZE, filtered.length),
    entries: filtered.slice(offset, offset + RESOURCE_PAGE_SIZE),
  }
}

export function resourcePageNumbers(page, pages) {
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])].filter((value) => value > 0 && value <= pages).sort((a, b) => a - b)
  return numbers.flatMap((value, index) => index && value - numbers[index - 1] > 1 ? [null, value] : [value])
}

export function resourceReadingMinutes(entry) {
  const words = String(entry.body || '').trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.ceil(words / 200)) : null
}
