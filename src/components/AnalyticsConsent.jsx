import { useEffect, useState } from 'react'
import {
  denyAnalyticsConsent,
  getAnalyticsConsent,
  grantAnalyticsConsent,
  isAnalyticsConfigured,
} from '../utils/tracking'

export default function AnalyticsConsent({ lang, open, onClose }) {
  const [decision, setDecision] = useState('loading')
  const configured = isAnalyticsConfigured()

  useEffect(() => {
    setDecision(getAnalyticsConsent() || 'unset')
  }, [])

  if (!configured || decision === 'loading' || (decision !== 'unset' && !open)) return null

  const isFrench = lang === 'fr'
  const privacyHref = isFrench ? '/privacy.html' : '/privacy-en.html'
  const accept = () => {
    grantAnalyticsConsent()
    setDecision('granted')
    onClose?.()
  }
  const refuse = () => {
    denyAnalyticsConsent()
    setDecision('denied')
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
            {isFrench ? 'Mesure d’audience' : 'Audience measurement'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            {isFrench
              ? 'Avec votre accord, nous utilisons Google Analytics pour mesurer les visites et les actions utiles, sans transmettre vos coordonnées ni le contenu libre des formulaires. Le tag Google reste désactivé tant que vous refusez ou ne faites aucun choix.'
              : 'With your consent, we use Google Analytics to measure visits and useful actions without sending your contact details or form free-text. The Google tag stays disabled if you refuse or make no choice.'}
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
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={refuse}
          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          {isFrench ? 'Refuser' : 'Reject'}
        </button>
        <button
          type="button"
          onClick={accept}
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/90"
        >
          {isFrench ? 'Accepter la mesure' : 'Accept analytics'}
        </button>
      </div>
    </aside>
  )
}
