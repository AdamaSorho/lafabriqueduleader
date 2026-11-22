export const contentApiBase = String(import.meta.env.VITE_CONTENT_API_BASE || '').replace(/\/$/, '')

export async function contentRequest(path, { token, body, signal } = {}) {
  if (!contentApiBase) throw new Error('Le service de publication n’est pas encore configuré. / Publishing is not configured yet.')
  const response = await fetch(`${contentApiBase}${path}`, {
    method: body ? 'PUT' : 'GET', signal,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.error || (response.status === 401 ? 'Session expirée. Reconnectez-vous. / Session expired. Sign in again.' : 'Impossible de charger les contenus. / Could not load content.'))
    error.status = response.status
    throw error
  }
  return data
}
