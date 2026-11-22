import { getLocalizedPath } from '../seo'

export default function PageLink({ page, lang, hash = '', onNavigate, onClick, children, ...props }) {
  return (
    <a
      {...props}
      href={`${getLocalizedPath(page, lang)}${hash}`}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !onNavigate) return
        event.preventDefault()
        onNavigate(page, { hash })
      }}
    >
      {children}
    </a>
  )
}
