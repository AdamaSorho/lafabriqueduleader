import ResourceLibrary from './ResourceLibrary'
import MediaLibrary from './MediaLibrary'

export default function CollectionPage({ type, lang, onNavigate, hub, status, onRetry, navigationVersion }) {
  const props = { lang, status, onRetry, onNavigate, navigationVersion }
  return type === 'resources'
    ? <ResourceLibrary {...props} copy={hub.resources} />
    : <MediaLibrary {...props} copy={hub.media} />
}
