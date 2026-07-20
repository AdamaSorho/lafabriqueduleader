import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './AppRoot.jsx'
import { getRouteContext } from './seo'

const root = document.getElementById('root')
const route = getRouteContext(window.location.pathname, document.documentElement.dataset.lang)
const app = (
  <StrictMode>
    <App initialPath={window.location.pathname} initialPage={route.page} initialLang={route.lang} />
  </StrictMode>
)

if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
