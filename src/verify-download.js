// Client that calls the API verification endpoint and renders the PDF inline
// so the browser URL stays on your domain (no redirect to Lambda URL).

const params = new URLSearchParams(window.location.search)
const email = params.get('e') || params.get('email')
const sig = params.get('sig')
const lang = params.get('lang') || 'fr'

const base = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE)
  ? String(import.meta.env.VITE_API_BASE)
  : ''

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
  ;(async () => {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || `Request failed: ${res.status}`)
      }
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/pdf')) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Unexpected response type')
      }
      const buf = await res.arrayBuffer()
      const blob = new Blob([buf], { type: 'application/pdf' })
      const urlObj = URL.createObjectURL(blob)
      const el = document.getElementById('status')
      if (el) el.remove()
      const iframe = document.createElement('iframe')
      iframe.style.width = '100%'
      iframe.style.height = '100vh'
      iframe.style.border = '0'
      iframe.src = urlObj
      document.body.appendChild(iframe)
    } catch (err) {
      console.error(err)
      showError('Could not open the PDF. Please try again later.')
    }
  })()
}
