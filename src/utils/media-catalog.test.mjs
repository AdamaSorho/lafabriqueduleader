import test from 'node:test'
import assert from 'node:assert/strict'
import { hubContent } from '../hub-content.js'
import { buildMediaCatalog, readMediaLocation, setMediaQuery } from './media-catalog.js'

const entries = Array.from({ length: 13 }, (_, index) => ({ id: `media-${index}`, category: index < 8 ? 'videos' : 'podcasts', title: index === 9 ? 'L’écoute attentive' : `Média ${index}`, description: 'Une conversation', body: 'Prendre du recul.' }))
const copy = { ...hubContent.fr.media, entries }

test('media pagination shows six cards and clamps missing pages', () => {
  assert.equal(buildMediaCatalog(copy, readMediaLocation()).entries.length, 6)
  const second = buildMediaCatalog(copy, readMediaLocation('?page=2'))
  assert.deepEqual(second.entries.map(entry => entry.id), entries.slice(6, 12).map(entry => entry.id))
  assert.deepEqual([second.first, second.last, second.total, second.pages], [7, 12, 13, 3])
  const last = buildMediaCatalog(copy, readMediaLocation('?page=999'))
  assert.equal(last.page, 3)
  assert.equal(last.entries.length, 1)
})

test('only formats with content are displayed and empty libraries expose no formats', () => {
  assert.deepEqual(buildMediaCatalog(copy, readMediaLocation()).formats.map(format => format.id), ['podcasts', 'videos'])
  const empty = buildMediaCatalog({ ...copy, entries: [] }, readMediaLocation('?format=videos&page=2'))
  assert.equal(empty.formats.length, 0)
  assert.equal(empty.total, 0)
  assert.equal(empty.page, 1)
})

test('media search composes with format selection and French accents', () => {
  const filtered = buildMediaCatalog(copy, readMediaLocation('?format=podcasts&q=ecoute'))
  assert.equal(filtered.total, 1)
  assert.equal(filtered.entries[0].id, 'media-9')
  assert.equal(buildMediaCatalog(copy, readMediaLocation('?format=videos&q=ecoute')).total, 0)
})

test('old media links continue to select a format or open an entry', () => {
  assert.equal(buildMediaCatalog(copy, readMediaLocation('', '#podcasts')).format, 'podcasts')
  assert.equal(buildMediaCatalog(copy, readMediaLocation('', '#conferences')).format, '')
  assert.equal(readMediaLocation('?page=2', '#entry-media-9').entryId, 'media-9')
  assert.doesNotThrow(() => readMediaLocation('', '#%bad'))
})

test('media query updates preserve unrelated URL parameters', () => {
  const url = new URL('https://lafabriqueduleader.com/mediatheque/?utm_source=test&page=2')
  setMediaQuery(url, { format: 'podcasts', query: ' écoute ', page: 3 })
  assert.equal(url.searchParams.get('format'), 'podcasts')
  assert.equal(url.searchParams.get('q'), 'écoute')
  assert.equal(url.searchParams.get('page'), '3')
  setMediaQuery(url)
  assert.equal(url.search, '?utm_source=test')
})
