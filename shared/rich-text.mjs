// A small supported subset of the editor document model, shared by API and renderer.
// No HTML, arbitrary element attributes, embeds, or executable URL schemes are accepted.
export const RICH_TEXT_LIMIT = 30000
const blockTypes = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'horizontalRule'])
const inlineTypes = new Set(['text', 'hardBreak'])
const markTypes = new Set(['bold', 'italic', 'underline', 'strike', 'link'])

export function safeEditorialUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return ''
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''
  } catch { return '' }
}

export function normalizeRichText(value) {
  let nodes = 0
  let characters = 0
  function visit(node, depth, parent) {
    if (!node || typeof node !== 'object' || Array.isArray(node) || ++nodes > 2000 || depth > 12) throw new Error('The formatted article is too complex or invalid.')
    const type = node.type
    const allowed = parent === null ? type === 'doc'
      : ['doc', 'blockquote', 'listItem'].includes(parent) ? blockTypes.has(type)
      : ['bulletList', 'orderedList'].includes(parent) ? type === 'listItem'
      : ['paragraph', 'heading'].includes(parent) ? inlineTypes.has(type) : false
    if (!allowed) throw new Error('This article contains unsupported formatting.')
    if (type === 'text') {
      if (typeof node.text !== 'string' || !node.text.length) throw new Error('Invalid article text.')
      characters += node.text.length
      if (characters > RICH_TEXT_LIMIT) throw new Error(`Article text must have at most ${RICH_TEXT_LIMIT} characters.`)
      const result = { type, text: node.text }
      if (node.marks !== undefined) {
        if (!Array.isArray(node.marks) || node.marks.length > 5) throw new Error('Invalid text formatting.')
        const seen = new Set()
        result.marks = node.marks.map((mark) => {
          if (!mark || !markTypes.has(mark.type) || seen.has(mark.type)) throw new Error('Unsupported text formatting.')
          seen.add(mark.type)
          if (mark.type !== 'link') return { type: mark.type }
          const href = safeEditorialUrl(mark.attrs?.href)
          if (!href) throw new Error('Article links must use a valid HTTP or HTTPS address.')
          return { type: 'link', attrs: { href } }
        })
        if (!result.marks.length) delete result.marks
      }
      return result
    }
    if (type === 'hardBreak' || type === 'horizontalRule') return { type }
    const result = { type }
    if (type === 'heading') {
      if (![2, 3].includes(node.attrs?.level)) throw new Error('Choose a section heading or subheading.')
      result.attrs = { level: node.attrs.level }
    }
    if (type === 'orderedList') {
      const start = node.attrs?.start ?? 1
      if (!Number.isSafeInteger(start) || start < 1 || start > 1000000) throw new Error('Invalid numbered list.')
      result.attrs = { start }
    }
    if (node.content !== undefined && !Array.isArray(node.content)) throw new Error('Invalid article structure.')
    const children = (node.content || []).map((child) => visit(child, depth + 1, type))
    if (['bulletList', 'orderedList', 'blockquote'].includes(type) && !children.length) throw new Error('Lists and quotes need content.')
    if (type === 'listItem' && children[0]?.type !== 'paragraph') throw new Error('Each list item must start with a paragraph.')
    if (type === 'doc' && !children.length) children.push({ type: 'paragraph' })
    if (children.length) result.content = children
    return result
  }
  const document = visit(value, 0, null)
  if (richTextToPlainText(document).length > RICH_TEXT_LIMIT) throw new Error(`Article text must have at most ${RICH_TEXT_LIMIT} characters.`)
  return document
}

export function richTextToPlainText(node) {
  if (node.type === 'text') return node.text
  if (node.type === 'hardBreak') return '\n'
  if (node.type === 'horizontalRule') return ''
  const children = node.content || []
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return children.map((child, index) => {
      const text = richTextToPlainText(child)
      return text.trim() ? `${node.type === 'bulletList' ? '•' : `${(node.attrs?.start || 1) + index}.`} ${text}` : ''
    }).join('\n')
  }
  return children.map(richTextToPlainText).join(['paragraph', 'heading'].includes(node.type) ? '' : '\n\n')
}

export function plainTextDocument(text = '') {
  const paragraphs = String(text).split(/\n\s*\n/).map((paragraph) => {
    const content = []
    paragraph.split('\n').forEach((line, index) => {
      if (index) content.push({ type: 'hardBreak' })
      if (line) content.push({ type: 'text', text: line })
    })
    return { type: 'paragraph', ...(content.length ? { content } : {}) }
  })
  return { type: 'doc', content: paragraphs }
}
