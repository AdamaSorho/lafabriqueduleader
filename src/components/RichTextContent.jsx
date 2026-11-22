import { createElement, useMemo } from 'react'
import { normalizeRichText, plainTextDocument, safeEditorialUrl } from '../../shared/rich-text.mjs'

function renderNode(node, key, headingLevel) {
  if (node.type === 'text') {
    return (node.marks || []).reduce((content, mark) => {
      const props = { key: `${key}-${mark.type}` }
      if (mark.type === 'link') {
        const href = safeEditorialUrl(mark.attrs?.href)
        return href ? <a key={props.key} href={href} target="_blank" rel="noopener noreferrer">{content}</a> : content
      }
      const tag = { bold: 'strong', italic: 'em', underline: 'u', strike: 's' }[mark.type]
      return tag ? createElement(tag, props, content) : content
    }, node.text)
  }
  if (node.type === 'hardBreak') return <br key={key} />
  if (node.type === 'horizontalRule') return <hr key={key} />
  const children = (node.content || []).map((child, index) => renderNode(child, `${key}-${index}`, headingLevel))
  const tag = {
    paragraph: 'p', blockquote: 'blockquote', bulletList: 'ul', orderedList: 'ol', listItem: 'li',
    heading: `h${Math.min(6, headingLevel + (node.attrs?.level === 3 ? 1 : 0))}`,
  }[node.type]
  return tag ? createElement(tag, { key, ...(node.type === 'orderedList' ? { start: node.attrs?.start || 1 } : {}) }, children) : children
}

export default function RichTextContent({ document, text = '', headingLevel = 4 }) {
  const content = useMemo(() => {
    if (document) {
      try { return normalizeRichText(document) } catch { /* Preserve a readable fallback for invalid legacy data. */ }
    }
    return plainTextDocument(text)
  }, [document, text])
  return <div className="editorial-prose">{renderNode(content, 'article', headingLevel)}</div>
}
