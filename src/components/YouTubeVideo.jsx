import { useState } from 'react'
import { parseYouTubeUrl, youtubeEmbedUrl } from '../utils/youtube'

export default function YouTubeVideo({ href, title, lang }) {
  const [playingSource, setPlayingSource] = useState(null)
  const video = parseYouTubeUrl(href)
  if (!video) return null
  const source = `${video.videoId}:${video.start}`
  const playLabel = lang === 'fr' ? 'Lire la vidéo' : 'Play video'
  const watchLabel = lang === 'fr' ? 'Regarder sur YouTube' : 'Watch on YouTube'
  return (
    <div className="youtube-video">
      <div className="youtube-frame">
        {playingSource === source ? (
          <iframe
            src={youtubeEmbedUrl(video, lang)}
            title={`${title} — YouTube`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="youtube-play" onClick={() => setPlayingSource(source)} aria-label={`${playLabel} : ${title}`}>
            <span className="youtube-provider">YouTube</span>
            <span className="youtube-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7z" /></svg></span>
            <span className="youtube-play-label">{playLabel}</span>
            <span className="youtube-video-title">{title}</span>
          </button>
        )}
      </div>
      <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className="youtube-watch-link">
        {watchLabel}<span aria-hidden="true">↗</span><span className="sr-only">{lang === 'fr' ? ' — ouvre un nouvel onglet' : ' — opens a new tab'}</span>
      </a>
    </div>
  )
}
