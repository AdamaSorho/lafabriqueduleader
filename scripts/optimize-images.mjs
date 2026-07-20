import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(rootDir, 'src', 'assets')
const outputDir = path.join(rootDir, 'public', 'assets', 'images')
const logoSource = path.join(sourceDir, 'logo.png')
const authorSource = path.join(sourceDir, 'author.avif')

await mkdir(outputDir, { recursive: true })

await sharp(authorSource)
  .resize({ width: 702, height: 1024, fit: 'inside', withoutEnlargement: true })
  .avif({ quality: 62, effort: 7 })
  .toFile(path.join(outputDir, 'ds-zonzerigue-author-702x1024.avif'))

await sharp(logoSource)
  .resize(256, 256, { fit: 'cover' })
  .webp({ quality: 84, effort: 6 })
  .toFile(path.join(outputDir, 'zli-logo-256.webp'))

await Promise.all([
  sharp(logoSource).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(rootDir, 'public', 'favicon-32x32.png')),
  sharp(logoSource).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(rootDir, 'public', 'favicon-192x192.png')),
  sharp(logoSource).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(rootDir, 'public', 'apple-touch-icon.png')),
])

const authorPanel = await sharp(authorSource)
  .resize(530, 630, { fit: 'cover', position: 'north' })
  .toBuffer()

async function createSocialImage({ filename, titleLines, taglineLines }) {
  const title = titleLines
    .map((line, index) => `<text x="72" y="${230 + (index * 72)}" fill="#ffffff" font-family="Georgia, serif" font-size="58" font-weight="700">${line}</text>`)
    .join('')
  const tagline = taglineLines
    .map((line, index) => `<text x="72" y="${410 + (index * 38)}" fill="#e5e5e5" font-family="Arial, sans-serif" font-size="25">${line}</text>`)
    .join('')
  const socialOverlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#0a0a0a"/>
      <rect x="668" width="4" height="630" fill="#d5a62e"/>
      <text x="72" y="135" fill="#d5a62e" font-family="Arial, sans-serif" font-size="24" font-weight="700">DS ZONZERIGUE</text>
      ${title}
      <line x1="72" y1="348" x2="545" y2="348" stroke="#d5a62e" stroke-width="3"/>
      ${tagline}
      <text x="72" y="548" fill="#aaaaaa" font-family="Arial, sans-serif" font-size="20">Zonzerigue Leadership International</text>
    </svg>
  `)

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: '#0a0a0a',
    },
  })
    .composite([
      { input: socialOverlay, left: 0, top: 0 },
      { input: authorPanel, left: 670, top: 0 },
    ])
    .jpeg({ quality: 84, progressive: true, chromaSubsampling: '4:4:4' })
    .toFile(path.join(outputDir, filename))
}

await Promise.all([
  createSocialImage({
    filename: 'la-fabrique-du-leader-social-1200x630.jpg',
    titleLines: ['LA FABRIQUE', 'DU LEADER'],
    taglineLines: ['Forgez un leadership lucide,', 'enraciné et profondément humain.'],
  }),
  createSocialImage({
    filename: 'the-leaders-inner-forge-social-1200x630.jpg',
    titleLines: ['THE LEADER’S', 'INNER FORGE'],
    taglineLines: ['Forge a lucid, grounded,', 'and deeply human leadership.'],
  }),
])

console.log('Optimized production images and browser icons.')
