const DataStore = require('nedb-promises')
const { String, Undefined, Record } = require('runtypes')
const escapeRegExp = require('escape-string-regexp')

const db = new DataStore(require.resolve('./search.db'))

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
exports.handler = async (event, context) => {
  try {
    const { q, offset, limit, sort, order } = Record({
      q: String,
      offset: String,
      limit: String.Or(Undefined),
      sort: String,
      order: String
    }).check(event.queryStringParameters)

    const count = await db.count({
      $or: ['symbol', 'description', 'hint'].map((k) => ({
        [k]: new RegExp(escapeRegExp(q), 'i')
      }))
    })

    const data = await db.find({
      $or: ['symbol', 'description', 'hint'].map((k) => ({
        [k]: new RegExp(escapeRegExp(q))
      }))
    }).sort({
      [sort]: order === 'desc' ? -1 : 1
    }).skip(parseInt(offset)).limit(parseInt(limit || '') || 5)

    return {
      statusCode: 200,
      body: JSON.stringify({ data, count })
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    }
  } catch (err) {
    return { statusCode: 500, body: err.toString() }
  }
}
