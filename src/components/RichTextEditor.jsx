import { useEffect, useId, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { normalizeRichText, plainTextDocument, richTextToPlainText, safeEditorialUrl, RICH_TEXT_LIMIT } from '../../shared/rich-text.mjs'

const extensions = [StarterKit.configure({
  heading: { levels: [2, 3] },
  code: false,
  codeBlock: false,
  link: { openOnClick: false, defaultProtocol: 'https', isAllowedUri: (url) => Boolean(safeEditorialUrl(url)) },
})]

function editorDocument(document, text) {
  if (document) {
    try { return normalizeRichText(document) } catch { /* Fall back to the preserved article text. */ }
  }
  return plainTextDocument(text)
}

export default function RichTextEditor({ value, text, onChange, disabled = false, lang, contentLang, label }) {
  const t = (fr, en) => lang === 'fr' ? fr : en
  const labelId = useId()
  const hintId = useId()
  const linkId = useId()
  const linkInputRef = useRef(null)
  const lastEmittedRef = useRef(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const characters = (text || '').length
  const editor = useEditor({
    extensions,
    content: editorDocument(value, text),
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: !disabled,
    editorProps: { attributes: { class: 'editorial-prose', role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': labelId, 'aria-describedby': hintId, lang: contentLang } },
    onUpdate: ({ editor: current }) => {
      const bodyRich = current.getJSON()
      lastEmittedRef.current = JSON.stringify(bodyRich)
      onChange({ bodyRich, body: richTextToPlainText(bodyRich) })
    },
  })
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => current ? {
      bold: current.isActive('bold'), italic: current.isActive('italic'), underline: current.isActive('underline'), strike: current.isActive('strike'),
      bulletList: current.isActive('bulletList'), orderedList: current.isActive('orderedList'), blockquote: current.isActive('blockquote'), link: current.isActive('link'),
      block: current.isActive('heading', { level: 2 }) ? '2' : current.isActive('heading', { level: 3 }) ? '3' : 'paragraph',
      canUndo: current.can().undo(), canRedo: current.can().redo(),
    } : null,
  })

  useEffect(() => { editor?.setEditable(!disabled, false) }, [editor, disabled])
  useEffect(() => {
    if (!editor || JSON.stringify(value) === lastEmittedRef.current) return
    const incoming = editorDocument(value, text)
    let existing
    try { existing = normalizeRichText(editor.getJSON()) } catch { existing = editor.getJSON() }
    if (JSON.stringify(incoming) !== JSON.stringify(existing)) editor.commands.setContent(incoming, { emitUpdate: false })
  }, [editor, value, text])
  useEffect(() => { if (linkOpen) linkInputRef.current?.focus() }, [linkOpen])

  const applyLink = () => {
    const href = safeEditorialUrl(linkUrl)
    if (!href) { setLinkError(t('Indiquez une adresse complète commençant par https:// ou http://.', 'Enter a full address starting with https:// or http://.')); return }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
    setLinkError('')
  }
  const controls = [
    { name: 'bold', label: t('Gras', 'Bold'), icon: <strong>B</strong>, run: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', label: t('Italique', 'Italic'), icon: <em>I</em>, run: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', label: t('Souligné', 'Underline'), icon: <u>U</u>, run: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', label: t('Barré', 'Strikethrough'), icon: <s>S</s>, run: () => editor.chain().focus().toggleStrike().run() },
    { name: 'bulletList', label: t('Liste à puces', 'Bullet list'), icon: '• ≡', run: () => editor.chain().focus().toggleBulletList().run() },
    { name: 'orderedList', label: t('Liste numérotée', 'Numbered list'), icon: '1. ≡', run: () => editor.chain().focus().toggleOrderedList().run() },
    { name: 'blockquote', label: t('Citation', 'Quote'), icon: '“ ”', run: () => editor.chain().focus().toggleBlockquote().run() },
  ]

  return (
    <div className="rich-editor-field">
      <p id={labelId} className="rich-editor-label">{label}</p>
      <div className="rich-editor" data-disabled={disabled}>
        <div className="rich-editor-toolbar" role="group" aria-label={t('Mise en forme du texte', 'Text formatting')}>
          <select aria-label={t('Style du paragraphe', 'Paragraph style')} disabled={disabled || !editor} value={state?.block || 'paragraph'} onChange={(event) => event.target.value === 'paragraph' ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: Number(event.target.value) }).run()}>
            <option value="paragraph">{t('Paragraphe', 'Paragraph')}</option>
            <option value="2">{t('Intertitre', 'Section heading')}</option>
            <option value="3">{t('Sous-titre', 'Subheading')}</option>
          </select>
          {controls.map((control) => (
            <button key={control.name} type="button" title={control.label} aria-label={control.label} aria-pressed={state?.[control.name] || false} disabled={disabled || !editor} onMouseDown={(event) => event.preventDefault()} onClick={control.run}>{control.icon}</button>
          ))}
          <button type="button" title={t('Ajouter ou modifier un lien', 'Add or edit link')} aria-label={t('Ajouter ou modifier un lien', 'Add or edit link')} aria-pressed={state?.link || false} aria-expanded={linkOpen} disabled={disabled || !editor} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkError(''); setLinkOpen((value) => !value) }}>{t('Lien', 'Link')}</button>
          <button type="button" title={t('Séparateur', 'Divider')} aria-label={t('Séparateur', 'Divider')} disabled={disabled || !editor} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</button>
          <button type="button" title={t('Effacer la mise en forme', 'Clear formatting')} aria-label={t('Effacer la mise en forme', 'Clear formatting')} disabled={disabled || !editor} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Tx</button>
          <button type="button" title={t('Annuler', 'Undo')} aria-label={t('Annuler', 'Undo')} disabled={disabled || !state?.canUndo} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().undo().run()}>↶</button>
          <button type="button" title={t('Rétablir', 'Redo')} aria-label={t('Rétablir', 'Redo')} disabled={disabled || !state?.canRedo} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().redo().run()}>↷</button>
        </div>
        {linkOpen && (
          <div className="rich-editor-link" role="group" aria-label={t('Lien', 'Link')}>
            <label htmlFor={linkId}>{t('Adresse du lien', 'Link address')}</label>
            <input ref={linkInputRef} id={linkId} type="url" value={linkUrl} placeholder="https://" maxLength={2048} aria-invalid={Boolean(linkError)} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); applyLink() }
              if (event.key === 'Escape') { event.preventDefault(); setLinkOpen(false); editor.commands.focus() }
            }} />
            <div className="rich-editor-link-actions">
              <button type="button" onClick={applyLink}>{t('Appliquer', 'Apply')}</button>
              <button type="button" disabled={!state?.link} onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkOpen(false) }}>{t('Supprimer le lien', 'Remove link')}</button>
              <button type="button" onClick={() => { setLinkOpen(false); editor.commands.focus() }}>{t('Fermer', 'Close')}</button>
            </div>
            {linkError && <p role="alert">{linkError}</p>}
          </div>
        )}
        {!editor && <p className="rich-editor-loading" role="status">{t('Chargement de l’éditeur…', 'Loading editor…')}</p>}
        <EditorContent editor={editor} />
      </div>
      <div id={hintId} className="rich-editor-help">
        <span>{t('Sélectionnez du texte pour le mettre en forme. Entrée crée un paragraphe ; Maj + Entrée ajoute un saut de ligne.', 'Select text to format it. Enter starts a paragraph; Shift + Enter adds a line break.')}</span>
        <span className={characters > RICH_TEXT_LIMIT ? 'rich-editor-limit' : ''}>{characters} / {RICH_TEXT_LIMIT}</span>
      </div>
    </div>
  )
}
