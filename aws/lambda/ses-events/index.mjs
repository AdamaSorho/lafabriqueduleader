// Lambda triggered by SNS (SES event destination)
// Updates DynamoDB statuses for bounces and complaints

import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

const ddb = new DynamoDBClient({})

function parseSnsRecord(rec) {
  try {
    const msg = JSON.parse(rec.Sns?.Message || '{}')
    return msg
  } catch {
    return null
  }
}

function getEventType(msg) {
  const t = msg?.eventType || msg?.notificationType || ''
  return String(t).toUpperCase()
}

function getEmail(msg) {
  // Try common SES/SNS shapes
  return (
    msg?.mail?.destination?.[0] ||
    msg?.bounce?.bouncedRecipients?.[0]?.emailAddress ||
    msg?.complaint?.complainedRecipients?.[0]?.emailAddress ||
    msg?.mail?.commonHeaders?.to?.[0] ||
    ''
  )
}

export const handler = async (event) => {
  const table = process.env.DDB_TABLE
  if (!table) return { statusCode: 200, body: 'ok' }

  const updates = []
  for (const rec of event?.Records || []) {
    const msg = parseSnsRecord(rec)
    if (!msg) continue
    const type = getEventType(msg)
    const email = getEmail(msg)
    if (!email) continue

    let status = null
    if (type.includes('BOUNCE')) status = 'bounced'
    else if (type.includes('COMPLAINT')) status = 'complained'
    if (!status) continue

    const now = Date.now()
    updates.push(
      ddb.send(new UpdateItemCommand({
        TableName: table,
        Key: { email: { S: email } },
        UpdateExpression: 'SET #s = :s, updatedAt = :t',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': { S: status }, ':t': { N: String(now) } },
      }))
    )
  }
  if (updates.length) await Promise.allSettled(updates)
  return { statusCode: 200, body: 'ok' }
}

