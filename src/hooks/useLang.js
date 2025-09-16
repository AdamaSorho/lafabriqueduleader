import { useEffect, useMemo, useState } from 'react'
import { content } from '../content'

export function useLang() {
  const [lang, setLang] = useState(() => {
    const url = new URL(window.location.href)
    const param = url.searchParams.get('lang')
    const cached = localStorage.getItem('lang')
    if (param) return param
    if (cached) return cached
    const prefs = (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || '']).map((l) => String(l).toLowerCase())
    const first = prefs.find(Boolean) || ''
    if (first.startsWith('en')) return 'en'
    if (first.startsWith('fr')) return 'fr'
    return 'fr'
  })
  useEffect(() => {
    localStorage.setItem('lang', lang)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    window.history.replaceState({}, '', url)
  }, [lang])
  const strings = useMemo(() => content[lang], [lang])
  return { lang, setLang, strings }
}

