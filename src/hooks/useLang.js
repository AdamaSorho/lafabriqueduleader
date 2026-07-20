import { useEffect, useMemo, useState } from 'react'
import { content } from '../content'
import { normalizeLang } from '../seo'

export function useLang(initialLang = 'fr') {
  const [lang, setLang] = useState(() => normalizeLang(initialLang))

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const strings = useMemo(() => content[lang] || content.fr, [lang])
  return { lang, setLang, strings }
}
