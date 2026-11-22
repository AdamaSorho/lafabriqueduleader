const domain = String(import.meta.env.VITE_ADMIN_AUTH_DOMAIN || '').replace(/\/$/, '')
const clientId = String(import.meta.env.VITE_ADMIN_CLIENT_ID || '')
const sessionKey = 'lfl-admin-session-v1'
const transactionKey = 'lfl-admin-login-v1'
export const adminAuthConfigured = Boolean(domain && clientId)
let callbackPromise

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function getAdminSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey))
    if (session?.accessToken && session.expiresAt > Date.now() + 30000) return session
  } catch { /* A missing or expired session requires sign-in. */ }
  sessionStorage.removeItem(sessionKey)
  return null
}

export async function signInAdmin() {
  if (!adminAuthConfigured) throw new Error('Admin sign-in is not configured yet.')
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)))
  const state = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  const redirectUri = `${window.location.origin}${window.location.pathname.startsWith('/en/') ? '/en/admin/' : '/admin/'}`
  sessionStorage.setItem(transactionKey, JSON.stringify({ verifier, state, redirectUri, createdAt: Date.now() }))
  const url = new URL('/oauth2/authorize', domain)
  url.search = new URLSearchParams({
    response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
    scope: 'openid email content/write', state, code_challenge: challenge, code_challenge_method: 'S256',
  }).toString()
  window.location.assign(url)
}

async function finishSignIn() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const providerError = url.searchParams.get('error')
  if (!code && !providerError) return getAdminSession()
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  const transaction = JSON.parse(sessionStorage.getItem(transactionKey) || 'null')
  sessionStorage.removeItem(transactionKey)
  if (providerError) throw new Error('Connexion annulée ou refusée. Réessayez. / Sign-in cancelled or denied. Try again.')
  if (!transaction || transaction.state !== state || Date.now() - transaction.createdAt > 900000 || transaction.redirectUri !== `${url.origin}${url.pathname}`) {
    throw new Error('Connexion expirée. Recommencez. / Sign-in expired. Please start again.')
  }
  const response = await fetch(new URL('/oauth2/token', domain), {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, redirect_uri: transaction.redirectUri, code, code_verifier: transaction.verifier }),
  })
  const data = await response.json()
  if (!response.ok || !data.access_token || !Number.isFinite(data.expires_in)) throw new Error('Connexion impossible. Réessayez. / Could not sign in. Please try again.')
  const session = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  sessionStorage.setItem(sessionKey, JSON.stringify(session))
  return session
}

export function restoreAdminSession() {
  // React StrictMode can mount twice; exchange a single-use code only once.
  callbackPromise ||= finishSignIn()
  return callbackPromise
}

export function signOutAdmin() {
  sessionStorage.removeItem(sessionKey)
  sessionStorage.removeItem(transactionKey)
  const url = new URL('/logout', domain)
  url.search = new URLSearchParams({ client_id: clientId, logout_uri: `${window.location.origin}${window.location.pathname}` }).toString()
  window.location.assign(url)
}
