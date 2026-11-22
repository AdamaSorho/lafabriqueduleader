import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPublishedHub } from './published-content.js'

const external = { id: 'external', type: 'resources', category: 'vue-ailleurs', featured: true, spotlightOnly: true, translations: { fr: { title: 'Un regard extérieur', href: 'https://example.com/fr' }, en: { title: 'Outside perspective', href: 'https://example.com/en' } } }
const internal = { id: 'article', type: 'resources', category: 'pratiquer', featured: true, translations: { fr: { title: 'Un article du site', body: 'Contenu.', href: 'https://example.com/source' } } }

test('external spotlights link directly while featured site articles keep their anchors', () => {
  const hub = buildPublishedHub({ entries: [external, internal] }, 'fr')
  assert.equal(hub.ticker.items.length, 2)
  assert.equal(hub.ticker.items[0].href, 'https://example.com/fr')
  assert.equal(hub.ticker.items[0].page, undefined)
  assert.equal(hub.ticker.items[1].page, 'resources')
  assert.equal(hub.ticker.items[1].hash, '#entry-article')
  assert.equal(hub.ticker.items[1].href, undefined)
  assert.deepEqual(hub.resources.entries.map((entry) => entry.id), ['article'])
})

test('external spotlight URLs follow the selected language and missing translations stay hidden', () => {
  const hub = buildPublishedHub({ entries: [external, internal] }, 'en')
  assert.equal(hub.ticker.items.length, 1)
  assert.equal(hub.ticker.items[0].href, 'https://example.com/en')
  assert.equal(hub.resources.entries.length, 0)
})

test('unsafe external destinations are excluded from the headline strip', () => {
  const unsafe = { ...external, translations: { fr: { title: 'Unsafe', href: 'javascript:alert(1)' } } }
  const hub = buildPublishedHub({ entries: [unsafe, internal] }, 'fr')
  assert.equal(hub.ticker.items.length, 1)
  assert.equal(hub.ticker.items[0].hash, '#entry-article')
})

test('both resource groups retain all six saved category IDs in both languages', async () => {
  const { CONTENT_CATEGORIES } = await import('../../shared/content-schema.mjs')
  for (const lang of ['fr', 'en']) {
    const hub = buildPublishedHub({ entries: [] }, lang)
    assert.equal(hub.resources.groups.length, 2)
    assert.deepEqual(hub.resources.groups.flatMap((group) => group.categoryIds), CONTENT_CATEGORIES.resources)
    assert.equal(new Set(hub.resources.groups.flatMap((group) => group.categoryIds)).size, 6)
  }
  const hub = buildPublishedHub({ entries: [external, internal] }, 'fr')
  assert.equal(hub.resources.groups[1].title, 'Les tendances du leadership')
  assert.equal(hub.resources.entries[0].category, 'pratiquer')
  assert.equal(hub.ticker.items[1].hash, '#entry-article')
})
