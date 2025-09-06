// Quick local sanity check for the bundled Lambda (no AWS calls)
// - Verifies the GET /verify-excerpt path signature + redirect logic
// - Does NOT exercise the POST/SES flow

import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Defaults for local check
process.env.SITE_URL = process.env.SITE_URL || 'https://example.com'
process.env.LINK_SIGNING_SECRET = process.env.LINK_SIGNING_SECRET || 'test-secret-123'
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

const email = process.env.TEST_EMAIL || 'user@example.com'
const secret = process.env.LINK_SIGNING_SECRET
const sig = crypto.createHmac('sha256', secret).update(email).digest('hex')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bundlePath = path.join(__dirname, 'dist', 'index.mjs')

const { handler } = await import(bundlePath)

async function runCase(label, e, s) {
  const event = {
    requestContext: { http: { method: 'GET', path: '/verify-excerpt' } },
    queryStringParameters: { e, sig: s },
  }
  const res = await handler(event)
  console.log(`\n[${label}] status=${res.statusCode}`)
  if (res.headers?.Location) console.log(`Location: ${res.headers.Location}`)
  if (res.body && res.statusCode !== 302) console.log(`Body: ${res.body}`)
}

await runCase('valid-signature', email, sig)
await runCase('invalid-signature', email, 'deadbeef')

console.log('\n✔ Bundle importable and handler executed.')

