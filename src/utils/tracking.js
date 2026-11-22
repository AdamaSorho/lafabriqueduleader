export const ANALYTICS_READY_EVENT = 'zli:analytics-ready'

const CONSENT_STORAGE_KEY = 'zli_analytics_consent_v1'
const GOOGLE_TAG_SCRIPT_ID = 'zli-google-tag'
const VALID_CONSENT_VALUES = new Set(['granted', 'denied'])
const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i
const GA_EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/

let initializedMeasurementId = ''
let lastPageViewKey = ''
let lastPageLocation = ''

const measurementId = () => {
  const value = import.meta.env?.VITE_GA_MEASUREMENT_ID
    ? String(import.meta.env.VITE_GA_MEASUREMENT_ID).trim()
    : ''
  return GA_MEASUREMENT_ID_PATTERN.test(value) ? value.toUpperCase() : ''
}

const trackingEndpoint = () =>
  import.meta.env?.VITE_TRACKING_ENDPOINT
    ? String(import.meta.env.VITE_TRACKING_ENDPOINT).trim()
    : ''

const consentSettings = (analyticsStorage) => ({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: analyticsStorage,
})

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
  }
  return window.gtag
}

function storeConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // A blocked storage API must leave analytics disabled rather than break the site.
  }
}

function clearGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => /^_ga(?:_|$)|^_gid$|^_gat/.test(name))

  const hostname = window.location.hostname
  const domains = ['', hostname, `.${hostname}`]
  for (const name of cookieNames) {
    for (const domain of domains) {
      const domainAttribute = domain ? `; Domain=${domain}` : ''
      document.cookie = `${name}=; Max-Age=0; Path=/${domainAttribute}; SameSite=Lax`
    }
  }
}

export function getAnalyticsConsent() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return VALID_CONSENT_VALUES.has(value) ? value : null
  } catch {
    return null
  }
}

export function isAnalyticsConfigured() {
  return Boolean(measurementId())
}

export function initializeAnalytics() {
  if (typeof window === 'undefined' || /^\/(?:en\/)?admin(?:\/|$)/.test(window.location.pathname) || getAnalyticsConsent() !== 'granted') return false

  const id = measurementId()
  if (!id) return false
  if (initializedMeasurementId === id) return true

  const gtag = ensureGtag()
  gtag('consent', 'default', consentSettings('denied'))
  gtag('consent', 'update', consentSettings('granted'))
  gtag('js', new Date())
  gtag('config', id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GOOGLE_TAG_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(script)
  }

  initializedMeasurementId = id
  window.dispatchEvent(new CustomEvent(ANALYTICS_READY_EVENT))
  return true
}

export function grantAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  storeConsent('granted')

  if (initializedMeasurementId) {
    ensureGtag()('consent', 'update', consentSettings('granted'))
    window.dispatchEvent(new CustomEvent(ANALYTICS_READY_EVENT))
    return true
  }
  return initializeAnalytics()
}

export function denyAnalyticsConsent() {
  if (typeof window === 'undefined') return
  storeConsent('denied')
  lastPageViewKey = ''
  lastPageLocation = ''

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', consentSettings('denied'))
  }
  clearGoogleAnalyticsCookies()
}

export function trackPageView(details = {}) {
  if (typeof window === 'undefined' || !initializeAnalytics()) return

  const pageLocation = `${window.location.origin}${window.location.pathname}${window.location.search}`
  const pageTitle = details.page_title || document.title
  const pageViewKey = `${pageLocation}|${pageTitle}`
  if (pageViewKey === lastPageViewKey) return

  const pageReferrer = lastPageLocation || document.referrer || undefined
  lastPageViewKey = pageViewKey
  lastPageLocation = pageLocation
  window.gtag('event', 'page_view', {
    ...details,
    page_title: pageTitle,
    page_location: pageLocation,
    page_path: `${window.location.pathname}${window.location.search}`,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
  })
}

export function trackEvent(eventName, details = {}) {
  if (
    typeof window === 'undefined' ||
    !GA_EVENT_NAME_PATTERN.test(eventName) ||
    getAnalyticsConsent() !== 'granted'
  ) {
    return
  }

  const eventDetails = {
    ...details,
    page_path: `${window.location.pathname}${window.location.search}`,
  }

  if (initializeAnalytics()) {
    window.gtag('event', eventName, eventDetails)
  }

  const endpoint = trackingEndpoint()
  if (!endpoint) return

  try {
    const body = JSON.stringify({
      event: eventName,
      ...eventDetails,
      page_hash: window.location.hash,
      ts: new Date().toISOString(),
    })
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
    // Analytics must never interrupt ordering or form submission.
  }
}
