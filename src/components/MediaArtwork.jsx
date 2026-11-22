import { useState } from 'react'
import { parseYouTubeUrl } from '../utils/youtube'

export function MediaFormatIcon({ format }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {format === 'podcasts' ? <><path d="M6 18v-3a10 10 0 0 1 20 0v3" /><rect x="4" y="16" width="5" height="11" rx="2" /><rect x="23" y="16" width="5" height="11" rx="2" /><path d="M13 12v8m6-8v8m-3-11v14" /></> : format === 'interviews' ? <><path d="M4 5h18v13H12l-6 5v-5H4z" /><path d="M25 11h3v13h-3v4l-5-4h-6v-3M9 10h8m-8 4h5" /></> : format === 'conferences' ? <><rect x="12" y="3" width="8" height="17" rx="4" /><path d="M8 15v2a8 8 0 0 0 16 0v-2M16 25v5m-5 0h10" /></> : format === 'presse' ? <><path d="M7 3h13l6 6v20H7zM20 3v7h6M12 15h9m-9 5h9m-9 5h5" /></> : <><rect x="3" y="5" width="26" height="22" rx="3" /><path d="m13 11 8 5-8 5z" /></>}
  </svg>
}

export default function MediaArtwork({ entry }) {
  const video = parseYouTubeUrl(entry.href)
  const thumbnail = video ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : ''
  const [failedSource, setFailedSource] = useState(null)
  return <div className="media-artwork" data-format={entry.category}>
    {thumbnail && failedSource !== thumbnail ? <img src={thumbnail} alt="" width="480" height="360" loading="lazy" decoding="async" onError={() => setFailedSource(thumbnail)} /> : <div className="media-artwork-symbol"><MediaFormatIcon format={entry.category} /></div>}
    {video && <span className="media-artwork-provider">YouTube</span>}
  </div>
}
