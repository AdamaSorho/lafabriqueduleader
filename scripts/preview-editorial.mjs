// Local-only editorial sandbox. This script is never imported by the production app.
import { createServer } from 'vite'
import { createHash, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createHandler } from '../aws/lambda/content/handler.mjs'
import { resourcePreviewEntries } from './fixtures/resources.mjs'
import { mediaPreviewEntries } from './fixtures/media.mjs'

const port = Number(process.env.EDITORIAL_PREVIEW_PORT || 4173)
const origin = `http://127.0.0.1:${port}`
const root = fileURLToPath(new URL('..', import.meta.url))
const clientId = 'local-editorial-preview'
const accessToken = randomUUID()
process.env.VITE_CONTENT_API_BASE = `${origin}/__editorial-preview`
process.env.VITE_ADMIN_AUTH_DOMAIN = origin
process.env.VITE_ADMIN_CLIENT_ID = clientId
process.env.VITE_GA_MEASUREMENT_ID = ''
process.env.VITE_TRACKING_ENDPOINT = ''
process.env.VITE_API_BASE = ''

const records = new Map([
  ['preview-article', {
    id: 'preview-article', revision: 1, type: 'resources', category: 'pratiquer', status: 'published', featured: true,
    translations: {
      fr: { title: 'Exemple — un article de La Fabrique', description: 'Un contenu local pour vérifier les liens internes.', body: 'Cet article de démonstration reste dans votre environnement local.', href: '' },
      en: { title: 'Example — an article from La Fabrique', description: 'Local content for checking internal links.', body: 'This demonstration article exists only in your local preview.', href: '' },
    },
  }],
  ['preview-trends', {
    id: 'preview-trends', revision: 1, type: 'resources', category: 'a-observer', status: 'published', featured: false,
    translations: {
      fr: { title: 'Exemple — observer les évolutions du leadership', description: 'Une réflexion de démonstration dans le groupe Les tendances du leadership.', body: 'Quelles évolutions méritent notre attention ? Cet exemple local illustre la nouvelle organisation des ressources.', href: '' },
      en: { title: 'Example — observing leadership trends', description: 'A demonstration reflection in the Leadership trends group.', body: 'Which developments deserve our attention? This local example shows how resources are organized.', href: '' },
    },
  }],
  ['preview-youtube', {
    id: 'preview-youtube', revision: 1, type: 'media', category: 'videos', status: 'published', featured: false,
    translations: {
      fr: { title: 'Exemple — lecteur YouTube', description: 'Vidéo de démonstration de YouTube, utilisée uniquement pour tester le lecteur dans cette prévisualisation locale.', body: '', href: 'https://www.youtube.com/watch?v=M7lc1UVf-VE' },
      en: { title: 'Example — YouTube player', description: 'YouTube demonstration video used only to try the player in this local preview.', body: '', href: 'https://www.youtube.com/watch?v=M7lc1UVf-VE' },
    },
  }],
  ['preview-external', {
    id: 'preview-external', revision: 1, type: 'resources', category: 'vue-ailleurs', status: 'draft', featured: true, spotlightOnly: true,
    translations: {
      fr: { title: 'Exemple — une lecture à découvrir', description: '', body: '', href: 'https://example.com/leadership' },
      en: { title: 'Example — a new perspective', description: '', body: '', href: 'https://example.com/leadership-en' },
    },
  }],
])
for (const entry of [...resourcePreviewEntries, ...mediaPreviewEntries]) records.set(entry.id, entry)
const authorizations = new Map()
const handler = createHandler({ store: {
  async list() { return [...records.values()] },
  async write(entry, revision) {
    if ((records.get(entry.id)?.revision || 0) !== revision) throw Object.assign(new Error('Conflict'), { name: 'ConditionalCheckFailedException' })
    records.set(entry.id, entry)
  },
} })
const readBody = async (request) => {
  let body = ''
  for await (const chunk of request) body += chunk
  return body
}
const isAdminUrl = (value) => {
  try { const url = new URL(value); return url.origin === origin && ['/admin/', '/en/admin/'].includes(url.pathname) } catch { return false }
}
const localMiddleware = async (request, response, next) => {
  try {
    const url = new URL(request.url, origin)
    if (url.pathname === '/oauth2/authorize') {
      const params = url.searchParams
      if (!isAdminUrl(params.get('redirect_uri')) || params.get('client_id') !== clientId || params.get('code_challenge_method') !== 'S256' || !params.get('state')) {
        response.writeHead(400); response.end('Invalid local sign-in request'); return
      }
      const code = randomUUID()
      authorizations.set(code, { challenge: params.get('code_challenge'), redirectUri: params.get('redirect_uri'), createdAt: Date.now() })
      const redirect = new URL(params.get('redirect_uri'))
      redirect.searchParams.set('code', code)
      redirect.searchParams.set('state', params.get('state'))
      response.writeHead(302, { Location: redirect.href }); response.end(); return
    }
    if (url.pathname === '/oauth2/token') {
      const body = new URLSearchParams(await readBody(request))
      const transaction = authorizations.get(body.get('code'))
      authorizations.delete(body.get('code'))
      const challenge = createHash('sha256').update(body.get('code_verifier') || '').digest('base64url')
      if (!transaction || transaction.challenge !== challenge || transaction.redirectUri !== body.get('redirect_uri') || body.get('client_id') !== clientId || Date.now() - transaction.createdAt > 900000) {
        response.writeHead(400, { 'Content-Type': 'application/json' }); response.end('{}'); return
      }
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify({ access_token: accessToken, expires_in: 1800 })); return
    }
    if (url.pathname === '/logout') {
      response.writeHead(302, { Location: isAdminUrl(url.searchParams.get('logout_uri')) ? url.searchParams.get('logout_uri') : `${origin}/admin/` })
      response.end(); return
    }
    if (!url.pathname.startsWith('/__editorial-preview/')) return next()
    const claims = request.headers.authorization === `Bearer ${accessToken}` ? { sub: 'local-editor', token_use: 'access', scope: 'content/write', 'cognito:groups': '[editors]' } : null
    const result = await handler({ rawPath: url.pathname.replace('/__editorial-preview', ''), body: await readBody(request), requestContext: { http: { method: request.method }, ...(claims ? { authorizer: { jwt: { claims } } } : {}) } })
    response.writeHead(result.statusCode, result.headers); response.end(result.body)
  } catch {
    response.writeHead(500); response.end('Local preview error')
  }
}
const app = await createServer({
  root,
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [{ name: 'local-editorial-preview', configureServer(server) { server.middlewares.use(localMiddleware) } }],
})
await app.listen()
console.log(`Editorial preview: ${origin}/admin/`)
console.log('Click Sign in / Se connecter to use the local demo. Content stays in memory; no AWS writes. Restarting restores the sample content.')
