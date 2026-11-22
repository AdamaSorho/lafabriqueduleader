import { lazy, Suspense, useEffect, useState } from 'react'
import { hubContent } from '../hub-content'
import { EXTERNAL_SPOTLIGHT_CATEGORIES, validateEntry } from '../../shared/content-schema.mjs'
import { contentApiBase, contentRequest } from '../utils/content-api'
import { adminAuthConfigured, getAdminSession, restoreAdminSession, signInAdmin, signOutAdmin } from '../utils/admin-auth'
import RichTextContent from './RichTextContent'
import ExternalSpotlightFields, { ExternalSpotlightPreview } from './ExternalSpotlightFields'
import YouTubeVideo from './YouTubeVideo'

const RichTextEditor = lazy(() => import('./RichTextEditor'))

const emptyTranslation = () => ({ title: '', description: '', body: '', href: '' })
const newEntry = () => ({ id: crypto.randomUUID(), revision: 0, type: 'resources', category: 'pratiquer', status: 'draft', featured: false, translations: { fr: emptyTranslation(), en: emptyTranslation() } })
const newExternalSpotlight = () => ({ ...newEntry(), category: 'vue-ailleurs', spotlightOnly: true, featured: true })

export default function AdminPortal({ lang }) {
  const t = (fr, en) => lang === 'fr' ? fr : en
  const copy = hubContent[lang]
  const spotlightCategories = copy.resources.categories.filter((category) => EXTERNAL_SPOTLIGHT_CATEGORIES.includes(category.id))
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [document, setDocument] = useState(null)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editLang, setEditLang] = useState('fr')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const configured = Boolean(contentApiBase && adminAuthConfigured)

  useEffect(() => {
    let active = true
    if (!configured) return
    restoreAdminSession().then((value) => { if (active) setSession(value) }).catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [configured])

  useEffect(() => {
    if (!session) return
    const controller = new AbortController()
    contentRequest('/admin/content', { token: session.accessToken, signal: controller.signal })
      .then((value) => setDocument(value))
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message) })
    return () => controller.abort()
  }, [session])

  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const mayDiscard = () => !dirty || window.confirm(t('Abandonner les modifications non enregistrées ?', 'Discard unsaved changes?'))
  const selectEntry = (entry) => {
    if (!mayDiscard()) return
    setSelected(entry.id)
    setDraft(structuredClone(entry))
    setDirty(false)
    setError('')
    setMessage('')
    setPreview(false)
  }
  const update = (changes) => { setDraft((value) => ({ ...value, ...changes })); setDirty(true); setMessage('') }
  const updateTranslation = (field, value) => update({ translations: { ...draft.translations, [editLang]: { ...draft.translations[editLang], [field]: value } } })
  const updateBody = (value) => update({ translations: { ...draft.translations, [editLang]: { ...draft.translations[editLang], ...value } } })
  const reload = async () => {
    if (!mayDiscard()) return
    setBusy(true)
    setError('')
    try {
      const value = await contentRequest('/admin/content', { token: session.accessToken })
      setDocument(value); setDraft(null); setSelected(null); setDirty(false)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const save = async (status) => {
    setError(''); setMessage('')
    try {
      if (!getAdminSession()) throw new Error(t('Votre session a expiré. Copiez vos modifications puis reconnectez-vous.', 'Your session expired. Copy your changes, then sign in again.'))
      const entry = { ...draft, status }
      const payload = validateEntry(entry)
      setBusy(true)
      const { entry: saved } = await contentRequest(`/admin/content/${entry.id}`, { token: session.accessToken, body: payload })
      setDocument((value) => ({ entries: value.entries.some((item) => item.id === saved.id) ? value.entries.map((item) => item.id === saved.id ? saved : item) : [saved, ...value.entries] })); setDraft(saved); setDirty(false)
      setMessage(status === 'published' ? saved.spotlightOnly ? t('Spotlight publié. Il apparaît maintenant dans le bandeau « À la une ».', 'Spotlight published. It now appears in the headline strip.') : t('Contenu publié. Il est maintenant visible sur le site.', 'Published. Your content is now visible on the site.') : t('Brouillon enregistré. Ce contenu n’est pas visible sur le site.', 'Draft saved. This content is not visible on the site.'))
      window.dispatchEvent(new Event('lfl-content-updated'))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const logout = () => { if (mayDiscard()) signOutAdmin() }

  if (!configured || !ready || !session) {
    return (
      <section className="admin-login hub-container">
        <a href={lang === 'fr' ? '/' : '/en/'} className="admin-home">← {t('Retour au site', 'Back to site')}</a>
        <p className="hub-eyebrow">La Fabrique · {t('Administration', 'Administration')}</p>
        <h1>{t('L’espace éditorial.', 'The editorial space.')}</h1>
        <p>{t('Préparez, enrichissez et publiez les contenus de La Fabrique. Cet espace est réservé aux membres de l’équipe disposant d’un accès.', 'Prepare, enrich, and publish content for La Fabrique. This space is reserved for team members with an account.')}</p>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {!configured ? <p className="admin-notice">{t('L’accès à l’administration sera disponible prochainement.', 'Admin access will be available soon.')}</p> : !ready ? <p role="status">{t('Vérification de la connexion…', 'Checking sign-in…')}</p> : <button className="admin-primary" type="button" onClick={() => signInAdmin().catch((err) => setError(err.message))}>{t('Se connecter', 'Sign in')}</button>}
      </section>
    )
  }

  const translation = draft?.translations[editLang] || emptyTranslation()
  return (
    <section className="admin-portal hub-container">
      <div className="admin-heading">
        <div><p className="hub-eyebrow">La Fabrique · Administration</p><h1>{t('Vos contenus.', 'Your content.')}</h1></div>
        <div className="admin-toolbar"><a href={lang === 'fr' ? '/en/admin/' : '/admin/'}>{lang === 'fr' ? 'English' : 'Français'}</a><a href={lang === 'fr' ? '/ressources/' : '/resources/'} target="_blank" rel="noreferrer">{t('Voir le site', 'View site')} ↗</a><button type="button" onClick={logout}>{t('Se déconnecter', 'Sign out')}</button></div>
      </div>
      {error && <div className="admin-error" role="alert">{error}<button type="button" disabled={busy} onClick={reload}>{t('Recharger les contenus', 'Reload content')}</button><button type="button" onClick={() => signInAdmin().catch((err) => setError(err.message))}>{t('Se reconnecter', 'Sign in again')}</button></div>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {!document ? <p role="status">{t('Chargement des contenus…', 'Loading content…')}</p> : (
        <div className="admin-workspace">
          <aside className="admin-list" aria-label={t('Contenus', 'Content')}>
            <button type="button" className="admin-primary" disabled={busy} onClick={() => selectEntry(newEntry())}>+ {t('Ajouter un contenu', 'Add content')}</button>
            <button type="button" className="admin-secondary" disabled={busy} onClick={() => selectEntry(newExternalSpotlight())}>+ {t('Ajouter un spotlight externe', 'Add an external spotlight')}</button>
            {!document.entries.length && <p className="admin-empty">{t('Aucun contenu pour le moment. Commencez par un brouillon.', 'No content yet. Start with a draft.')}</p>}
            {document.entries.map((entry) => (
              <button key={entry.id} type="button" className={`admin-list-item ${selected === entry.id ? 'is-selected' : ''}`} disabled={busy} onClick={() => selectEntry(entry)}>
                <span>{entry.translations[lang]?.title || entry.translations.fr?.title || entry.translations.en?.title}</span>
                <small>{entry.spotlightOnly ? t('À la une · Lien externe', 'Spotlight · External link') : copy[entry.type].eyebrow} · {entry.status === 'published' ? t('Publié', 'Published') : t('Brouillon', 'Draft')}</small>
              </button>
            ))}
          </aside>
          {draft ? (
            <form className="admin-editor" onSubmit={(event) => { event.preventDefault(); save('published') }}>
              <fieldset disabled={busy}>
                <legend>{draft.spotlightOnly ? t('Spotlight externe', 'External spotlight') : t('Éditer le contenu', 'Edit content')}{dirty ? ' · ' + t('Non enregistré', 'Unsaved') : ''}</legend>
                {!draft.spotlightOnly && <div className="admin-field-row">
                  <label>{t('Espace', 'Section')}<select value={draft.type} onChange={(event) => update({ type: event.target.value, category: copy[event.target.value].categories[0].id })}><option value="resources">{copy.resources.eyebrow}</option><option value="media">{copy.media.eyebrow}</option></select></label>
                  <label>{t('Rubrique', 'Category')}<select value={draft.category} onChange={(event) => update({ category: event.target.value })}>{draft.type === 'resources' ? copy.resources.groups.map((group) => <optgroup key={group.id} label={group.title}>{copy.resources.categories.filter((category) => group.categoryIds.includes(category.id)).map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</optgroup>) : copy.media.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label>
                </div>}
                <div className="admin-language" role="group" aria-label={t('Langue du contenu', 'Content language')}>
                  {['fr', 'en'].map((locale) => <button key={locale} type="button" aria-pressed={editLang === locale} onClick={() => setEditLang(locale)}>{locale === 'fr' ? 'Français' : 'English'}</button>)}
                </div>
                <p className="admin-hint">{t('Une traduction laissée vide ne sera pas affichée dans cette langue.', 'An empty translation will not appear in that language.')}</p>
                {draft.spotlightOnly ? (
                  <ExternalSpotlightFields lang={lang} categories={spotlightCategories} category={draft.category} onCategoryChange={(category) => update({ category })} translation={translation} onChange={updateTranslation} />
                ) : <>
                <label>{t('Titre', 'Title')}<input value={translation.title} maxLength={180} onChange={(event) => updateTranslation('title', event.target.value)} /></label>
                <label>{t('Résumé', 'Summary')}<textarea rows={3} value={translation.description} maxLength={600} onChange={(event) => updateTranslation('description', event.target.value)} /></label>
                <Suspense fallback={<p className="admin-hint" role="status">{t('Chargement de l’éditeur…', 'Loading editor…')}</p>}>
                  <RichTextEditor key={`${draft.id}-${editLang}`} value={translation.bodyRich} text={translation.body} onChange={updateBody} disabled={busy} lang={lang} contentLang={editLang} label={t('Texte de l’article ou de l’exercice', 'Article or exercise text')} />
                </Suspense>
                <label>{draft.type === 'media' ? t('Lien du média', 'Media link') : t('Lien vers la source (facultatif)', 'Source link (optional)')}<input type="url" placeholder="https://" value={translation.href} maxLength={2048} onChange={(event) => updateTranslation('href', event.target.value)} /></label>
                <p className="admin-hint">{draft.type === 'media' ? t('Un lien YouTube affiche un lecteur sur le site et dans l’aperçu. Les autres liens ouvrent la plateforme qui héberge le média.', 'A YouTube link adds a player on the site and in the preview. Other links open the platform hosting the media.') : t('Ajoutez une source si vous souhaitez proposer une lecture complémentaire.', 'Add a source if you want to offer further reading.')}</p>
                <label className="admin-checkbox"><input type="checkbox" checked={draft.featured} onChange={(event) => update({ featured: event.target.checked })} />{t('Afficher dans le bandeau « À la une » une fois publié', 'Feature in the headline strip when published')}</label>
                </>}
                <div className="admin-editor-actions">
                  <button type="button" onClick={() => setPreview((value) => !value)}>{t('Aperçu', 'Preview')}</button>
                  <button type="button" onClick={() => save('draft')}>{draft.status === 'published' ? t('Dépublier et enregistrer', 'Unpublish and save') : t('Enregistrer le brouillon', 'Save draft')}</button>
                  <button type="submit" className="admin-primary">{busy ? t('Enregistrement…', 'Saving…') : t('Publier', 'Publish')}</button>
                </div>
              </fieldset>
              {preview && (draft.spotlightOnly ? <ExternalSpotlightPreview translation={translation} category={spotlightCategories.find((category) => category.id === draft.category)?.title} lang={lang} /> : <article className="collection-entry admin-preview" lang={editLang}><p className="hub-eyebrow">{t('Aperçu', 'Preview')} · {editLang.toUpperCase()}</p><h3>{translation.title}</h3><p>{translation.description}</p>{draft.type === 'media' && <YouTubeVideo href={translation.href} title={translation.title} lang={lang} />}<RichTextContent document={translation.bodyRich} text={translation.body} /><p>{translation.href}</p></article>)}
            </form>
          ) : <div className="admin-start"><h2>{t('Une idée à partager ?', 'An idea to share?')}</h2><p>{t('Ajoutez un contenu ou sélectionnez un brouillon pour commencer.', 'Add content or select a draft to get started.')}</p></div>}
        </div>
      )}
    </section>
  )
}
