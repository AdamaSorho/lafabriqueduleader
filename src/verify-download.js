// Simple client that redirects to API verification endpoint, which then
// updates DynamoDB (status=verified) and redirects to the PDF.

const params = new URLSearchParams(window.location.search)
const email = params.get('e') || params.get('email')
const sig = params.get('sig')
const lang = params.get('lang') || 'fr'

const base = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE)
  ? String(import.meta.env.VITE_API_BASE)
  : ''

function redirectTo(href) {
  window.location.replace(href)
}

function showError(msg) {
  const el = document.getElementById('status')
  if (el) {
    el.textContent = msg || 'An error occurred.'
  }
}

if (!email || !sig) {
  showError('Missing parameters.')
} else {
  const api = base ? `${base.replace(/\/$/, '')}` : '/api'
  const url = `${api}/verify-excerpt?e=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}&lang=${encodeURIComponent(lang)}`
  redirectTo(url)
}
