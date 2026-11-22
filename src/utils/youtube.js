const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'])
const EMBED_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com'])

function parseStart(value) {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Math.min(Number(value), 86400)
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)
  if (!match || !match.slice(1).some(Boolean)) return 0
  return Math.min(Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0), 86400)
}

export function parseYouTubeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null
  let url
  try { url = new URL(value.trim()) } catch { return null }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null
  const segments = url.pathname.split('/').filter(Boolean)
  let videoId
  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
    if (segments.length === 1) videoId = segments[0]
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v')
    else if (segments.length === 2 && ['embed', 'shorts', 'live'].includes(segments[0])) videoId = segments[1]
  } else if (EMBED_HOSTS.has(url.hostname) && segments.length === 2 && segments[0] === 'embed') {
    videoId = segments[1]
  }
  if (!VIDEO_ID.test(videoId || '')) return null
  const start = parseStart(url.searchParams.get('start') || url.searchParams.get('t') || (url.hash.startsWith('#t=') ? url.hash.slice(3) : ''))
  const watch = new URL('https://www.youtube.com/watch')
  watch.searchParams.set('v', videoId)
  if (start) watch.searchParams.set('t', `${start}s`)
  return { videoId, start, watchUrl: watch.href }
}

export function youtubeEmbedUrl(video, lang) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${video.videoId}`)
  url.search = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', hl: lang === 'en' ? 'en' : 'fr', ...(video.start ? { start: String(video.start) } : {}) }).toString()
  return url.href
}
