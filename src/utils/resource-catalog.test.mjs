import test from 'node:test'
import assert from 'node:assert/strict'
import { hubContent } from '../hub-content.js'
import { buildResourceCatalog, readResourceLocation, resourcePageNumbers, setResourceQuery } from './resource-catalog.js'

const entries = Array.from({ length: 14 }, (_, index) => ({ id: `item-${index}`, category: index < 9 ? 'pratiquer' : 'a-observer', title: index === 2 ? 'Déléguer avec clarté' : `Article ${index}`, description: 'Une réflexion', body: 'Un exercice de leadership.' }))
const copy = { ...hubContent.fr.resources, entries }

test('shows six cards per page and clamps out-of-range pages', () => {
  assert.equal(buildResourceCatalog(copy, readResourceLocation()).entries.length, 6)
  const second = buildResourceCatalog(copy, readResourceLocation('?page=2'))
  assert.deepEqual(second.entries.map((entry) => entry.id), entries.slice(6, 12).map((entry) => entry.id))
  assert.deepEqual([second.first, second.last, second.total, second.pages], [7, 12, 14, 3])
  const last = buildResourceCatalog(copy, readResourceLocation('?page=999'))
  assert.equal(last.page, 3)
  assert.equal(last.entries.length, 2)
  assert.equal(readResourceLocation('?page=-1').page, 1)
  assert.equal(readResourceLocation('?page=NaN').page, 1)
})

test('only populated themes and topics are offered', () => {
  const model = buildResourceCatalog(copy, readResourceLocation())
  assert.equal(model.groups.length, 2)
  assert.deepEqual(model.topics.map((topic) => topic.id), ['pratiquer', 'a-observer'])
  const practiceOnly = buildResourceCatalog({ ...copy, entries: entries.slice(0, 5) }, readResourceLocation())
  assert.equal(practiceOnly.groups.length, 1)
  assert.equal(practiceOnly.topics.length, 1)
  const empty = buildResourceCatalog({ ...copy, entries: [] }, readResourceLocation('?page=2'))
  assert.deepEqual([empty.groups.length, empty.topics.length, empty.entries.length, empty.total, empty.first], [0, 0, 0, 0, 0])
})

test('search and filters compose, including French accents and no-result cases', () => {
  const search = buildResourceCatalog(copy, readResourceLocation('?q=deleguer+clarte'))
  assert.equal(search.total, 1)
  assert.equal(search.entries[0].id, 'item-2')
  assert.equal(buildResourceCatalog(copy, readResourceLocation('?group=tendances-du-leadership')).total, 5)
  assert.equal(buildResourceCatalog(copy, readResourceLocation('?topic=pratiquer&q=introuvable')).total, 0)
})

test('legacy links resolve filters and existing article fragments resolve the reader', () => {
  assert.equal(buildResourceCatalog(copy, readResourceLocation('', '#a-observer')).topic, 'a-observer')
  assert.equal(buildResourceCatalog(copy, readResourceLocation('', '#tendances-du-leadership')).group, 'tendances-du-leadership')
  assert.equal(buildResourceCatalog(copy, readResourceLocation('', '#la-pause')).topic, '')
  assert.equal(readResourceLocation('?page=2', '#entry-item-9').entryId, 'item-9')
  assert.doesNotThrow(() => readResourceLocation('', '#%invalid'))
})

test('query changes keep unrelated parameters and pagination links stay compact', () => {
  const url = new URL('https://lafabriqueduleader.com/ressources/?utm_source=test&group=old&page=5')
  setResourceQuery(url, { group: 'pratiquer-le-leadership', query: ' leadership ', page: 2 })
  assert.equal(url.searchParams.get('utm_source'), 'test')
  assert.equal(url.searchParams.get('q'), 'leadership')
  setResourceQuery(url)
  assert.equal(url.search, '?utm_source=test')
  assert.deepEqual(resourcePageNumbers(5, 10), [1, null, 4, 5, 6, null, 10])
})

test('external spotlights are never resource cards or category counts', () => {
  const model = buildResourceCatalog({ ...copy, entries: [{ ...entries[0], spotlightOnly: true }] }, readResourceLocation())
  assert.equal(model.available, 0)
  assert.equal(model.groups.length, 0)
})
