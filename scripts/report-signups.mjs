#!/usr/bin/env node
// Summarize recent signup records from DynamoDB
// Usage examples:
//   AWS_PROFILE=TerraformMindapax node scripts/report-signups.mjs --table newsletter_signups --hours 72
//   node scripts/report-signups.mjs --table newsletter_signups --since 2025-09-07T00:00:00Z

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'

function parseArgs(argv) {
  const out = { table: process.env.DDB_TABLE || 'newsletter_signups', hours: 72, since: null, region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--table') out.table = argv[++i]
    else if (a === '--hours') out.hours = Number(argv[++i])
    else if (a === '--since') out.since = argv[++i]
    else if (a === '--region') out.region = argv[++i]
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scripts/report-signups.mjs --table <name> [--hours N | --since ISO] [--region us-east-1]')
      process.exit(0)
    }
  }
  return out
}

function n(v) {
  if (!v) return null
  const x = Number(v.N || v)
  return Number.isFinite(x) ? x : null
}

function s(v) { return v?.S || v || '' }

async function scanAll(client, table) {
  const items = []
  let ExclusiveStartKey
  do {
    const res = await client.send(new ScanCommand({ TableName: table, ExclusiveStartKey }))
    if (res.Items) items.push(...res.Items)
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return items
}

function fmtTs(ms) {
  return ms ? new Date(ms).toISOString() : ''
}

async function main() {
  const args = parseArgs(process.argv)
  const region = args.region
  const client = new DynamoDBClient(region ? { region } : {})

  const sinceMs = args.since ? Date.parse(args.since) : Date.now() - (args.hours * 3600 * 1000)
  if (!Number.isFinite(sinceMs)) {
    console.error('Invalid --since. Use ISO format, e.g. 2025-09-07T00:00:00Z')
    process.exit(2)
  }

  console.log(`Reading table: ${args.table}`)
  const all = await scanAll(client, args.table)

  const filtered = []
  const counts = Object.create(null)
  const langs = Object.create(null)
  const sources = Object.create(null)

  for (const it of all) {
    const ts = n(it.ts)
    const verifiedAt = n(it.verifiedAt)
    const updatedAt = n(it.updatedAt)
    const lastTs = Math.max(...[ts, verifiedAt, updatedAt].filter((x) => Number.isFinite(x)))
    if (!Number.isFinite(lastTs) || lastTs < sinceMs) continue
    const status = s(it.status) || 'unknown'
    const email = s(it.email)
    const lang = s(it.lang) || 'unk'
    const source = s(it.source) || 'unk'
    counts[status] = (counts[status] || 0) + 1
    langs[lang] = (langs[lang] || 0) + 1
    sources[source] = (sources[source] || 0) + 1
    filtered.push({ email, status, lang, source, ts, verifiedAt, updatedAt, lastTs })
  }

  filtered.sort((a, b) => b.lastTs - a.lastTs)

  const total = filtered.length
  console.log('\nSummary')
  console.log(`- Window since: ${fmtTs(sinceMs)}`)
  console.log(`- Total records: ${total}`)
  const keys = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])
  for (const k of keys) console.log(`- ${k}: ${counts[k]}`)

  const langKeys = Object.keys(langs)
  if (langKeys.length) {
    console.log('\nBy language')
    for (const k of langKeys) console.log(`- ${k}: ${langs[k]}`)
  }

  const sourceKeys = Object.keys(sources)
  if (sourceKeys.length) {
    console.log('\nBy source')
    for (const k of sourceKeys) console.log(`- ${k}: ${sources[k]}`)
  }

  const maxList = 20
  console.log(`\nMost recent (${Math.min(maxList, filtered.length)} of ${filtered.length})`)
  for (const it of filtered.slice(0, maxList)) {
    const last = fmtTs(it.lastTs)
    console.log(`- ${last}  ${it.status.padEnd(10)}  ${it.lang.padEnd(2)}  ${it.email}`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })

