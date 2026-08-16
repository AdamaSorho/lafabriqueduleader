import { useEffect, useState } from 'react'
import {
  denyAnalyticsConsent,
  getAnalyticsConsent,
  grantAnalyticsConsent,
  isAnalyticsConfigured,
} from '../utils/tracking'

export default function AnalyticsConsent({ lang, open, onClose }) {
  const [decision, setDecision] = useState('loading')
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const configured = isAnalyticsConfigured()

  useEffect(() => {
    const consent = getAnalyticsConsent()
    setDecision(consent || 'unset')
    setAnalyticsEnabled(consent === 'granted')
    setShowPreferences(Boolean(open))
  }, [open])

  if (!configured || decision === 'loading' || (decision !== 'unset' && !open)) return null

  const isFrench = lang === 'fr'
  const privacyHref = isFrench ? '/privacy.html' : '/privacy-en.html'
  const saveConsent = (allowAnalytics) => {
    if (allowAnalytics) grantAnalyticsConsent()
    else denyAnalyticsConsent()
    setAnalyticsEnabled(allowAnalytics)
    setDecision(allowAnalytics ? 'granted' : 'denied')
    setShowPreferences(false)
    onClose?.()
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-lg border border-black/15 bg-white p-5 shadow-2xl sm:bottom-5 sm:p-6"
      aria-labelledby="analytics-consent-title"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="analytics-consent-title" className="text-base font-semibold text-gray-950">
            {showPreferences
              ? isFrench ? 'Préférences de confidentialité' : 'Privacy preferences'
              : isFrench ? 'Votre confidentialité' : 'Your privacy'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            {showPreferences
              ? isFrench
                ? 'Configurez la mesure d’audience. Les cookies essentiels restent toujours actifs.'
                : 'Configure audience measurement. Essential cookies always remain active.'
              : isFrench
                ? 'Nous utilisons des cookies essentiels pour assurer le fonctionnement et la sécurité du site. Avec votre accord, Google Analytics nous aide aussi à mesurer son utilisation.'
                : 'We use essential cookies to keep the site working and secure. With your consent, Google Analytics also helps us measure site usage.'}
          </p>
          <a
            href={privacyHref}
            className="mt-2 inline-flex text-xs font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-black"
          >
            {isFrench ? 'Consulter la politique de confidentialité' : 'Read the privacy policy'}
          </a>
        </div>
        {decision !== 'unset' && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label={isFrench ? 'Fermer' : 'Close'}
          >
            ×
          </button>
        )}
      </div>

      {showPreferences && (
        <div id="cookie-preferences-categories" className="mt-5 divide-y divide-black/10 border-y border-black/10">
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">
                  {isFrench ? 'Cookies essentiels' : 'Essential cookies'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  {isFrench
                    ? 'Nécessaires au fonctionnement du site, à la sécurité des formulaires et à la mémorisation de vos préférences.'
                    : 'Required for site operation, form security, and remembering your preferences.'}
                </p>
                <span className="mt-1 block text-xs font-medium text-gray-700">
                  {isFrench ? 'Toujours actifs' : 'Always active'}
                </span>
              </div>
              <span
                role="switch"
                aria-checked="true"
                aria-disabled="true"
                aria-label={isFrench ? 'Cookies essentiels toujours actifs' : 'Essential cookies always active'}
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-black"
              >
                <span className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">
                  {isFrench ? 'Mesure d’audience' : 'Audience measurement'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  {isFrench
                    ? 'Google Analytics mesure les visites et les actions utiles sans recevoir vos coordonnées ni le contenu libre des formulaires.'
                    : 'Google Analytics measures visits and useful actions without receiving your contact details or form free-text.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsEnabled}
                aria-label={isFrench ? 'Autoriser la mesure d’audience' : 'Allow audience measurement'}
                onClick={() => setAnalyticsEnabled((enabled) => !enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${analyticsEnabled ? 'bg-black' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${analyticsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => saveConsent(false)}
          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          {isFrench ? 'Refuser' : 'Reject'}
        </button>
        <button
          type="button"
          aria-expanded={showPreferences}
          aria-controls="cookie-preferences-categories"
          onClick={() => showPreferences ? saveConsent(analyticsEnabled) : setShowPreferences(true)}
          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          {showPreferences
            ? isFrench ? 'Enregistrer les préférences' : 'Save preferences'
            : isFrench ? 'Voir les préférences' : 'View preferences'}
        </button>
        <button
          type="button"
          onClick={() => saveConsent(true)}
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/90"
        >
          {isFrench ? 'Accepter' : 'Accept'}
        </button>
      </div>
    </aside>
  )
}
