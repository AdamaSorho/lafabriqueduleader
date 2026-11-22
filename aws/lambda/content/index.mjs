import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { createHandler } from './handler.mjs'

const client = new DynamoDBClient({})
const store = {
  async list({ publishedOnly }) {
    const entries = []
    let cursor
    do {
      const result = await client.send(new ScanCommand({
        TableName: process.env.CONTENT_TABLE, ConsistentRead: true,
        ...(cursor ? { ExclusiveStartKey: cursor } : {}),
        ...(publishedOnly ? { FilterExpression: '#status = :published', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':published': { S: 'published' } } } : {}),
      }))
      entries.push(...(result.Items || []).map((item) => JSON.parse(item.payload.S)))
      cursor = result.LastEvaluatedKey
    } while (cursor)
    return entries
  },
  async write(entry, previousRevision, author) {
    await client.send(new PutItemCommand({
      TableName: process.env.CONTENT_TABLE,
      Item: {
        id: { S: entry.id }, payload: { S: JSON.stringify(entry) }, status: { S: entry.status },
        revision: { N: String(entry.revision) }, updatedBy: { S: author }, updatedAt: { S: entry.updatedAt },
      },
      ConditionExpression: previousRevision === 0 ? 'attribute_not_exists(id)' : 'revision = :previous',
      ...(previousRevision === 0 ? {} : { ExpressionAttributeValues: { ':previous': { N: String(previousRevision) } } }),
    }))
  },
}
export const handler = createHandler({ store })
