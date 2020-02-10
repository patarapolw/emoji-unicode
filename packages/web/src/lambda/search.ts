import yaml from 'js-yaml'
import { Search } from 'js-search'
import { String, Undefined, Record } from 'runtypes'
import { Handler } from 'aws-lambda'

const db = new Search('symbol')
db.addIndex('symbol')
db.addIndex('code')
db.addIndex('description')
db.addIndex('hint')
db.addDocuments(Object.values(yaml.safeLoad(require('raw-loader!./search/codes.yaml').default)))

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const handler: Handler = async (event, context) => {
  try {
    const { q, offset: offsetStr, limit: limitStr, sort, order } = Record({
      q: String,
      offset: String,
      limit: String.Or(Undefined),
      sort: String,
      order: String
    }).check(event.queryStringParameters)

    const offset = parseInt(offsetStr)
    const end = offset + (parseInt(limitStr || '') || 5)

    const allData = db.search(q)
    const count = allData.length
    const data = allData
      .sort((a, b) => a.toString().localeCompare(b.toString()) * (order === 'desc' ? -1 : 1))
      .slice(offset, end)

    return {
      statusCode: 200,
      body: JSON.stringify({ data, count })
    }
  } catch (err) {
    return { statusCode: 500, body: err.toString() }
  }
}

export { handler }
