import { renderToString } from 'react-dom/server'
import AppRoot from './AppRoot'

export function render({ path, page, lang }) {
  return renderToString(
    <AppRoot initialPath={path} initialPage={page} initialLang={lang} />
  )
}
