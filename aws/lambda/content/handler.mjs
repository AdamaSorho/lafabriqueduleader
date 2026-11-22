import { validateEntry, publishedContent } from '../../../shared/content-schema.mjs'

const reply = (statusCode, data) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  body: JSON.stringify(data),
})

function isEditor(event) {
  // API Gateway validates signature, issuer, audience, expiry, and route scope.
  // This Lambda has no public Function URL; only API Gateway can invoke it.
  const claims = event.requestContext?.authorizer?.jwt?.claims
  const groups = String(claims?.['cognito:groups'] || '').split(/[\s,"\[\]]+/)
  return claims?.token_use === 'access' && String(claims.scope || '').split(' ').includes('content/write') && groups.includes('editors') && Boolean(claims.sub)
}

export function createHandler({ store, now = () => new Date().toISOString() }) {
  return async (event) => {
    const method = event.requestContext?.http?.method
    const path = event.rawPath || event.requestContext?.http?.path || ''
    const isPublic = method === 'GET' && path === '/content'
    const isAdminList = method === 'GET' && path === '/admin/content'
    const saveMatch = method === 'PUT' && path.match(/^\/admin\/content\/([a-zA-Z0-9-]{1,64})$/)
    if (!isPublic && !isAdminList && !saveMatch) return reply(404, { error: 'Not found.' })
    if (!isPublic && !isEditor(event)) return reply(403, { error: 'Editor access required.' })
    try {
      if (method === 'GET') {
        const entries = await store.list({ publishedOnly: isPublic })
        entries.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        return reply(200, isPublic ? publishedContent({ entries }) : { entries })
      }
      const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || ''
      if (Buffer.byteLength(body, 'utf8') > 300000) return reply(413, { error: 'Content exceeds the 300 KB limit.' })
      let entry
      try {
        entry = validateEntry(JSON.parse(body))
        if (entry.id !== saveMatch[1]) throw new Error('Content ID does not match the URL.')
      } catch (error) { return reply(400, { error: error.message }) }
      const next = { ...entry, revision: entry.revision + 1, updatedAt: now() }
      await store.write(next, entry.revision, event.requestContext.authorizer.jwt.claims.sub)
      return reply(200, { entry: next })
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') return reply(409, { error: 'Another editor saved this content. Reload the latest version before saving again.' })
      console.error('Content API failure', error.name)
      return reply(503, { error: 'Content is temporarily unavailable. Please try again.' })
    }
  }
}
