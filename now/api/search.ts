import { NowRequest, NowResponse } from '@now/node'
import { String, Undefined, Record } from 'runtypes'
import Loki from 'lokijs'
import escapeRegExp from 'escape-string-regexp'

let db: Loki

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
export default async (req: NowRequest, res: NowResponse) => {
  const { q, offset: offsetStr, limit: limitStr, sort, order } = Record({
    q: String,
    offset: String,
    limit: String.Or(Undefined),
    sort: String,
    order: String
  }).check(req.query)

  const offset = parseInt(offsetStr)
  const limit = parseInt(limitStr || '') || 5

  if (!db) {
    await new Promise(resolve => {
      db = new Loki(`${__dirname}/emoji.loki`, {
        autoload: true,
        autoloadCallback: resolve
      })
    })
  }

  const col = db.getCollection('emoji')
  const count = col.count({
    $or: ['symbol', 'description', 'hint'].map((k) => ({ [k]: { $regex: new RegExp(escapeRegExp(q), 'i') } }))
  })
  const data = col.chain().find({
    $or: ['symbol', 'description', 'hint'].map((k) => ({ [k]: { $regex: new RegExp(escapeRegExp(q), 'i') } }))
  }).simplesort(sort, { desc: order === 'desc' }).offset(offset).limit(limit).data()

  res.json({ data, count })
}
