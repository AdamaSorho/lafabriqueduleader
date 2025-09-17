import logo from '../assets/logo.png'

export default function Footer({ strings, lang }) {
  const email = strings.footer?.email
  const address = strings.footer?.address
  const socials = strings.footer?.socials || []
  const privacyHref = lang === 'fr' ? '/privacy.html' : '/privacy-en.html'
  const termsHref = lang === 'fr' ? '/terms.html' : '/terms-en.html'
  const brand = strings.footer?.brand || strings.hero?.brand || 'La Fabrique du Leader'
  const Icon = ({ kind }) => {
    const cls = 'size-4'
    switch (kind) {
      case 'linkedin':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM9 8h4.8v2.2h.07c.67-1.2 2.3-2.47 4.73-2.47C22.4 7.73 24 10 24 13.6V24h-5v-8.6c0-2.05-.04-4.69-2.86-4.69-2.86 0-3.3 2.23-3.3 4.54V24H9z" /></svg>)
      case 'x':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2H21l-6.79 7.74L22 22h-5.82l-4.55-5.9L6.2 22H3.44l7.25-8.27L2 2h5.94l4.1 5.47L18.24 2zM8.24 4H6.08l9.78 13.11h2.23L8.24 4z" /></svg>)
      case 'instagram':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18.5 5.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>)
      case 'youtube':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.7 3.5 12 3.5 12 3.5s-7.7 0-9.4.6A3 3 0 00.5 6.2C0 7.9 0 12 0 12s0 4.1.5 5.8a3 3 0 002.1 2.1c1.7.6 9.4.6 9.4.6s7.7 0 9.4-.6a3 3 0 002.1-2.1c.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.5V8.5l6.3 3.5-6.3 3.5z" /></svg>)
      case 'facebook':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988H7.898v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>)
      case 'tiktok':
        return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2h3.5c.3 2.1 1.6 3.9 3.5 4.9v3.3c-1.4-.03-2.8-.4-4-1.1v5.6c0 3.7-3 6.7-6.7 6.7S1.6 18.4 1.6 14.7s3-6.7 6.7-6.7c.4 0 .8 0 1.2.1v3.3c-.4-.1-.8-.2-1.2-.2-1.9 0-3.4 1.5-3.4 3.5s1.5 3.5 3.4 3.5 3.4-1.5 3.4-3.5V2z" /></svg>)
      default:
        return null
    }
  }
  return (
    <footer id="contact" className="border-t border-black/10 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src={logo} alt={brand} className="h-6 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{brand}</span>
            {strings.footer?.byline && (
              <span className="text-[11px] text-gray-500">{strings.footer.byline}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {(email || address) && (
            <div className="flex flex-col items-center sm:items-start">
              {email && (
                <a href={`mailto:${email}`} className="text-xs text-gray-700 hover:text-black">{email}</a>
              )}
              {address && (
                <div className="text-xs text-gray-700">{address}</div>
              )}
            </div>
          )}
          {socials.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{strings.footer.follow}</span>
              {socials.filter((s)=>s.url).map((s) => (
                <a key={s.kind} href={s.url} aria-label={s.label} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-black/10 p-2 text-gray-700 hover:bg-gray-50 hover:text-black">
                  <Icon kind={s.kind} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 text-xs text-gray-500 sm:items-end">
          <div>© {new Date().getFullYear()} — Tous droits réservés</div>
          <div className="flex items-center gap-3">
            <a href={privacyHref} className="hover:text-black">{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <span aria-hidden>·</span>
            <a href={termsHref} className="hover:text-black">{lang === 'fr' ? 'Conditions' : 'Terms'}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
