import { safeEditorialUrl } from '../../shared/rich-text.mjs'

export function ExternalSpotlightPreview({ translation, category, lang }) {
  const href = safeEditorialUrl(translation.href)
  return (
    <aside className="external-spotlight-preview" aria-label={lang === 'fr' ? 'Aperçu du spotlight externe' : 'External spotlight preview'}>
      <p className="hub-eyebrow">{category}</p>
      <p className="external-spotlight-headline">{translation.title || (lang === 'fr' ? 'Votre titre apparaîtra ici' : 'Your headline will appear here')}<span aria-hidden="true">↗</span></p>
      {href ? <a href={href} target="_blank" rel="noopener noreferrer">{new URL(href).hostname}<span className="sr-only">{lang === 'fr' ? ' — ouvre un nouvel onglet' : ' — opens a new tab'}</span></a> : <p className="external-spotlight-hint">{lang === 'fr' ? 'Ajoutez une URL pour vérifier la destination.' : 'Add a URL to check the destination.'}</p>}
    </aside>
  )
}

export default function ExternalSpotlightFields({ lang, categories, category, onCategoryChange, translation, onChange }) {
  const t = (fr, en) => lang === 'fr' ? fr : en
  return (
    <div className="external-spotlight-fields">
      <p className="admin-notice">{t('Mettez en avant un article, une vidéo, un événement ou un site. Une fois publié, ce spotlight apparaîtra dans « À la une » et ouvrira directement le lien dans un nouvel onglet.', 'Feature an article, video, event, or website. Once published, this spotlight appears in the headline strip and opens the destination directly in a new tab.')}</p>
      <label>{t('Rubrique du bandeau', 'Headline category')}<select value={category} onChange={(event) => onCategoryChange(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>{t('Titre du spotlight', 'Spotlight headline')}<input name="spotlight-title" value={translation.title} maxLength={180} onChange={(event) => onChange('title', event.target.value)} placeholder={t('Le titre à afficher dans le bandeau', 'The headline to display in the strip')} /></label>
      <label>{t('URL de destination', 'Destination URL')}<input name="spotlight-url" type="url" value={translation.href} maxLength={2048} onChange={(event) => onChange('href', event.target.value)} placeholder="https://example.com/article" /></label>
      <p className="admin-hint">{t('Un titre et une URL complète sont nécessaires pour publier chaque langue. Vous pouvez utiliser une destination différente en anglais.', 'A headline and full URL are required to publish each language. You can use a different destination in English.')}</p>
    </div>
  )
}
