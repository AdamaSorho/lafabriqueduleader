import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { getSeo, STATIC_ROUTES } from '../src/seo.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')
const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
const headPattern = /<meta name="seo-head-start"[^>]*>[\s\S]*?<meta name="seo-head-end"[^>]*>/
const rootPattern = '<div id="root"></div>'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function renderSeoHead(seo) {
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const imageAlt = escapeHtml(seo.imageAlt)

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    `<link rel="canonical" href="${seo.canonicalUrl}">`,
    `<link rel="alternate" hreflang="fr" href="${seo.frenchUrl}">`,
    `<link rel="alternate" hreflang="en" href="${seo.englishUrl}">`,
    `<link rel="alternate" hreflang="x-default" href="${seo.frenchUrl}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="La Fabrique du Leader">',
    `<meta property="og:locale" content="${seo.locale}">`,
    `<meta property="og:locale:alternate" content="${seo.alternateLocale}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${seo.canonicalUrl}">`,
    `<meta property="og:image" content="${seo.imageUrl}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${imageAlt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${seo.imageUrl}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`,
    `<script id="structured-data" type="application/ld+json">${safeJson(seo.structuredData)}</script>`,
  ].join('\n    ')
}

if (!headPattern.test(template) || !template.includes(rootPattern)) {
  throw new Error('The built index is missing the prerender placeholders.')
}

const vite = await createServer({
  root: rootDir,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')

  for (const route of STATIC_ROUTES) {
    const seo = getSeo(route.page, route.lang)
    const appHtml = render(route)
    const html = template
      .replace(/<html[^>]*>/, `<html lang="${seo.lang}" data-page="${seo.page}" data-lang="${seo.lang}">`)
      .replace(headPattern, renderSeoHead(seo))
      .replace(rootPattern, `<div id="root">${appHtml}</div>`)
    const outputPath = path.join(distDir, route.output)

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }
} finally {
  await vite.close()
}

console.log(`Prerendered ${STATIC_ROUTES.length} localized routes.`)
