// Cloudflare Worker: proxy to Lambda Function URL with HMAC signing
// 1) Set a Worker secret `API_SHARED_SECRET` with the same value as Terraform var `api_shared_secret`.
// 2) Route e.g. https://lafabriqueduleader.com/api/* to this worker.
// 3) In the site, set VITE_API_BASE=https://lafabriqueduleader.com/api

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const upstream = env.UPSTREAM_URL // e.g., https://xxxx.lambda-url.us-east-1.on.aws
    if (!upstream) return new Response('Missing UPSTREAM_URL', { status: 500 })
    // Only sign POST requests that we forward to backend
    const method = request.method.toUpperCase()
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const target = new URL(upstream.replace(/\/$/, '') + path + (url.search || ''))

    const init = { method, headers: new Headers(request.headers), body: null }
    // Clean hop-by-hop and CF headers, set Host to upstream
    init.headers.delete('host'); init.headers.delete('cf-connecting-ip'); init.headers.delete('x-forwarded-for')
    if (method === 'POST') {
      const body = await request.text()
      init.body = body
      if (env.API_SHARED_SECRET) {
        const ts = Math.floor(Date.now() / 1000)
        const data = `${ts}.${method}.${path}.${body}`
        const sig = await signHmac(env.API_SHARED_SECRET, data)
        init.headers.set('x-api-ts', String(ts))
        init.headers.set('x-api-sig', sig)
      }
      // Ensure content-type is JSON when forwarding
      if (!init.headers.get('content-type')) init.headers.set('content-type', 'application/json')
    }
    return fetch(target.toString(), init)
  }
}

async function signHmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

