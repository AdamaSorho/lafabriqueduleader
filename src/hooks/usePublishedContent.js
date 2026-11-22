import { useEffect, useMemo, useState } from 'react'
import { buildPublishedHub } from '../utils/published-content'
import { contentApiBase, contentRequest } from '../utils/content-api'

export function usePublishedContent(lang) {
  const [document, setDocument] = useState(null)
  const [status, setStatus] = useState(contentApiBase ? 'loading' : 'ready')
  const [requestVersion, setRequestVersion] = useState(0)
  useEffect(() => {
    if (!contentApiBase) return
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const data = await contentRequest('/content', { signal: controller.signal })
        if (!Array.isArray(data.entries)) throw new Error('Invalid content response')
        setDocument(data)
        setStatus('ready')
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('error')
      }
    }
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('lfl-content-updated', refresh)
    return () => {
      controller.abort()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('lfl-content-updated', refresh)
    }
  }, [requestVersion])
  const hub = useMemo(() => buildPublishedHub(document, lang), [document, lang])
  return { hub, status, reload: () => setRequestVersion((value) => value + 1) }
}
