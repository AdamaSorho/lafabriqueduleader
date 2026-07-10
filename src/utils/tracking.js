const trackingEndpoint = () =>
  import.meta.env?.VITE_TRACKING_ENDPOINT
    ? String(import.meta.env.VITE_TRACKING_ENDPOINT)
    : ''

export function trackEvent(eventName, details = {}) {
  if (!eventName || typeof window === 'undefined') return

  const payload = {
    event: eventName,
    ...details,
    page_path: window.location.pathname,
    page_hash: window.location.hash,
    ts: new Date().toISOString(),
  }

  window.dataLayer?.push(payload)
  window.gtag?.('event', eventName, details)

  const endpoint = trackingEndpoint()
  if (!endpoint) return

  try {
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Tracking must never interrupt the purchase path.
  }
}
