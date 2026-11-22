import test from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from './handler.mjs'

const editor = { sub: 'editor-1', token_use: 'access', scope: 'openid email content/write', 'cognito:groups': '[editors]' }
const translation = { title: 'Une décision consciente', description: 'Un exercice de réflexion.', body: 'Prenez une minute pour réfléchir.', href: '' }
const entry = (overrides = {}) => ({ id: 'item-1', revision: 0, type: 'resources', category: 'pratiquer', status: 'draft', featured: false, translations: { fr: { ...translation }, en: {} }, ...overrides })
const event = (method, path, body, claims = editor) => ({ rawPath: path, requestContext: { http: { method }, ...(claims ? { authorizer: { jwt: { claims } } } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
function setup() {
  const records = new Map()
  const handler = createHandler({ store: {
    async list() { return [...records.values()].map((value) => structuredClone(value)) },
    async write(value, previousRevision) {
      if ((records.get(value.id)?.revision || 0) !== previousRevision) throw Object.assign(new Error('Conflict'), { name: 'ConditionalCheckFailedException' })
      records.set(value.id, structuredClone(value))
    },
  }, now: () => '2026-11-11T12:00:00.000Z' })
  return { handler, records }
}

test('anonymous users cannot list drafts or write content', async () => {
  const { handler, records } = setup()
  for (const request of [event('GET', '/admin/content', undefined, null), event('PUT', '/admin/content/item-1', entry(), null)]) assert.equal((await handler(request)).statusCode, 403)
  assert.equal(records.size, 0)
})
test('editor group, access token, scope, and identity are all required', async () => {
  const { handler } = setup()
  for (const change of [{ 'cognito:groups': 'readers' }, { token_use: 'id' }, { scope: 'openid email' }, { sub: '' }]) {
    assert.equal((await handler(event('PUT', '/admin/content/item-1', entry(), { ...editor, ...change }))).statusCode, 403)
  }
})
test('draft → publish → unpublish updates public visibility without a rebuild', async () => {
  const { handler } = setup()
  let result = await handler(event('PUT', '/admin/content/item-1', entry()))
  assert.equal(result.statusCode, 200)
  assert.equal(JSON.parse(result.body).entry.revision, 1)
  assert.deepEqual(JSON.parse((await handler(event('GET', '/content'))).body), { entries: [] })
  assert.equal(JSON.parse((await handler(event('GET', '/admin/content'))).body).entries.length, 1)
  result = await handler(event('PUT', '/admin/content/item-1', entry({ revision: 1, status: 'published', featured: true })))
  assert.equal(result.statusCode, 200)
  const published = JSON.parse((await handler(event('GET', '/content'))).body).entries[0]
  assert.equal(published.featured, true)
  assert.equal(published.translations.en, undefined)
  assert.equal(published.revision, undefined)
  assert.equal(published.updatedBy, undefined)
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ revision: 2, status: 'draft' })))).statusCode, 200)
  assert.deepEqual(JSON.parse((await handler(event('GET', '/content'))).body).entries, [])
})
test('stale updates cannot overwrite another editor’s work', async () => {
  const { handler, records } = setup()
  await handler(event('PUT', '/admin/content/item-1', entry()))
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry()))).statusCode, 409)
  assert.equal(records.get('item-1').revision, 1)
})
test('editing separate records does not create a global content conflict', async () => {
  const { handler } = setup()
  for (const id of ['item-1', 'item-2']) assert.equal((await handler(event('PUT', `/admin/content/${id}`, entry({ id })))).statusCode, 200)
})
test('rejects mismatched IDs, malformed JSON, unknown categories and oversized requests', async () => {
  const { handler } = setup()
  assert.equal((await handler(event('PUT', '/admin/content/other', entry()))).statusCode, 400)
  assert.equal((await handler({ ...event('PUT', '/admin/content/item-1'), body: '{' })).statusCode, 400)
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ category: 'unknown' })))).statusCode, 400)
  assert.equal((await handler({ ...event('PUT', '/admin/content/item-1'), body: 'x'.repeat(300001) })).statusCode, 413)
})
test('untrusted URLs and incomplete published translations are rejected', async () => {
  const { handler } = setup()
  for (const href of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com']) {
    const value = entry({ translations: { fr: { ...translation, href } } })
    assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 400)
  }
  const value = entry({ status: 'published', translations: { fr: translation, en: { title: 'Incomplete translation' } } })
  assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 400)
})
test('media publication requires a media link', async () => {
  const { handler } = setup()
  const value = entry({ type: 'media', category: 'podcasts', status: 'published' })
  assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 400)
  value.translations.fr.href = 'https://example.com/podcast'
  assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 200)
})
test('published bilingual content remains separate and text stays plain', async () => {
  const { handler } = setup()
  const value = entry({ status: 'published', translations: { fr: translation, en: { ...translation, title: 'A deliberate decision', body: '<script>bad()</script>' } } })
  assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 200)
  const result = JSON.parse((await handler(event('GET', '/content'))).body).entries[0]
  assert.equal(result.translations.en.body, '<script>bad()</script>')
  assert.notEqual(result.translations.en.title, result.translations.fr.title)
})
test('invalid brand names are rejected before saving', async () => {
  const { handler } = setup()
  for (const title of ['DS Zonzerigue Leadership International', 'Zonzerigu\u00e9', 'DS ZLI']) {
    assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ translations: { fr: { ...translation, title } } })))).statusCode, 400)
  }
})
test('storage failures return a safe error instead of internal details', async () => {
  const handler = createHandler({ store: { async list() { throw new Error('Private database credentials') } } })
  const result = await handler(event('GET', '/content'))
  assert.equal(result.statusCode, 503)
  assert.ok(!result.body.includes('credentials'))
})

test('formatted articles round-trip and derive a readable plain-text fallback', async () => {
  const { handler } = setup()
  const bodyRich = { type: 'doc', content: [
    { type: 'heading', attrs: { level: 2, onclick: 'bad()' }, content: [{ type: 'text', text: 'Prendre du recul' }] },
    { type: 'paragraph', content: [
      { type: 'text', text: 'Une intention ', marks: [{ type: 'bold' }] },
      { type: 'text', text: 'claire', marks: [{ type: 'italic' }] },
      { type: 'hardBreak' },
      { type: 'text', text: 'La source', marks: [{ type: 'link', attrs: { href: 'https://example.com/article', onclick: 'bad()' } }] },
    ] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Écouter' }] }] }] },
    { type: 'orderedList', attrs: { start: 2 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Décider' }] }] }] },
    { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quel résultat compte ?' }] }] },
    { type: 'horizontalRule' },
  ] }
  const value = entry({ status: 'published', translations: { fr: { ...translation, body: 'Outdated fallback', bodyRich }, en: {} } })
  const saved = await handler(event('PUT', '/admin/content/item-1', value))
  assert.equal(saved.statusCode, 200)
  const result = JSON.parse((await handler(event('GET', '/content'))).body).entries[0].translations.fr
  assert.match(result.body, /Prendre du recul/)
  assert.match(result.body, /• Écouter/)
  assert.match(result.body, /2\. Décider/)
  assert.ok(!result.body.includes('Outdated'))
  assert.equal(result.bodyRich.content[0].attrs.level, 2)
  assert.ok(!JSON.stringify(result.bodyRich).includes('onclick'))
  assert.equal(result.bodyRich.content[1].content[3].marks[0].attrs.href, 'https://example.com/article')
})

test('an empty formatted translation is still absent from public content', async () => {
  const { handler } = setup()
  const value = entry({ status: 'published', translations: { fr: translation, en: { bodyRich: { type: 'doc', content: [{ type: 'paragraph' }] } } } })
  assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 200)
  assert.equal(JSON.parse((await handler(event('GET', '/content'))).body).entries[0].translations.en, undefined)
})

test('formatted links reject executable schemes and unsupported elements', async () => {
  const { handler } = setup()
  for (const href of ['javascript:alert(1)', 'data:text/html,bad', 'java\nscript:alert(1)', 'https://name:password@example.com/']) {
    const bodyRich = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href } }] }] }] }
    assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ translations: { fr: { ...translation, bodyRich } } })))).statusCode, 400)
  }
  for (const type of ['script', 'iframe', 'image']) {
    const bodyRich = { type: 'doc', content: [{ type, attrs: { src: 'https://example.com/' } }] }
    assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ translations: { fr: { ...translation, bodyRich } } })))).statusCode, 400)
  }
})

test('formatting cannot bypass brand validation by splitting text into marks', async () => {
  const { handler } = setup()
  const bodyRich = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'text', text: 'DS ', marks: [{ type: 'bold' }] },
    { type: 'text', text: 'Zonzerigue Leadership International' },
  ] }] }
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ translations: { fr: { ...translation, bodyRich } } })))).statusCode, 400)
})

test('formatted content enforces text, depth and structure limits', async () => {
  const { handler } = setup()
  let deep = { type: 'paragraph' }
  for (let i = 0; i < 15; i++) deep = { type: 'blockquote', content: [deep] }
  const documents = [
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(30001) }] }] },
    { type: 'doc', content: [deep] },
    { type: 'doc', content: [{ type: 'bulletList', content: [{ type: 'text', text: 'Not a list item' }] }] },
    { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Invalid heading level' }] }] },
  ]
  for (const bodyRich of documents) assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ translations: { fr: { ...translation, bodyRich } } })))).statusCode, 400)
})

test('empty formatted lists do not count as article content', async () => {
  const { handler } = setup()
  for (const type of ['bulletList', 'orderedList']) {
    const bodyRich = { type: 'doc', content: [{ type, content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }] }
    const value = entry({ status: 'published', translations: { fr: { ...translation, body: '', bodyRich } } })
    assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 400)
  }
})

test('external spotlights need only a headline and URL and support draft/publish/unpublish', async () => {
  const { handler } = setup()
  const value = entry({ spotlightOnly: true, category: 'vue-ailleurs', featured: false, translations: { fr: { title: 'Un regard extérieur', href: 'https://example.com/article' }, en: {} } })
  let result = await handler(event('PUT', '/admin/content/item-1', value))
  assert.equal(result.statusCode, 200)
  assert.equal(JSON.parse(result.body).entry.featured, true)
  assert.equal(JSON.parse((await handler(event('GET', '/content'))).body).entries.length, 0)
  result = await handler(event('PUT', '/admin/content/item-1', { ...value, revision: 1, status: 'published' }))
  assert.equal(result.statusCode, 200)
  const published = JSON.parse((await handler(event('GET', '/content'))).body).entries[0]
  assert.equal(published.spotlightOnly, true)
  assert.equal(published.translations.fr.href, 'https://example.com/article')
  assert.equal(published.translations.fr.description, '')
  assert.equal(published.translations.fr.body, '')
  assert.equal(published.translations.en, undefined)
  assert.equal((await handler(event('PUT', '/admin/content/item-1', { ...value, revision: 2 }))).statusCode, 200)
  assert.equal(JSON.parse((await handler(event('GET', '/content'))).body).entries.length, 0)
})

test('external spotlight destinations are validated in every published language', async () => {
  const { handler } = setup()
  for (const href of ['', 'javascript:alert(1)', 'data:text/html,hello', 'https://name:secret@example.com', '/relative']) {
    const value = entry({ spotlightOnly: true, category: 'vue-ailleurs', status: 'published', translations: { fr: { title: 'Un lien externe', href } } })
    assert.equal((await handler(event('PUT', '/admin/content/item-1', value))).statusCode, 400)
  }
  const bilingual = entry({ spotlightOnly: true, category: 'a-observer', status: 'published', translations: { fr: { title: 'À découvrir', href: 'https://example.com/fr' }, en: { title: 'Worth a look', href: 'https://example.com/en' } } })
  assert.equal((await handler(event('PUT', '/admin/content/item-1', bilingual))).statusCode, 200)
  const published = JSON.parse((await handler(event('GET', '/content'))).body).entries[0]
  assert.equal(published.translations.en.href, 'https://example.com/en')
  assert.equal(published.translations.fr.href, 'https://example.com/fr')
})

test('external spotlights cannot weaken normal article validation or use media categories', async () => {
  const { handler } = setup()
  const translation = { title: 'Un titre', href: 'https://example.com/' }
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ status: 'published', translations: { fr: translation } })))).statusCode, 400)
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ spotlightOnly: true, category: 'pratiquer', translations: { fr: translation } })))).statusCode, 400)
  assert.equal((await handler(event('PUT', '/admin/content/item-1', entry({ spotlightOnly: true, type: 'media', category: 'podcasts', translations: { fr: translation } })))).statusCode, 400)
})
