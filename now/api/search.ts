import { NowRequest, NowResponse } from '@now/node'
import { String, Undefined, Record } from 'runtypes'
import Loki from 'lokijs'
import QSearch from '@patarapolw/qsearch'

let db: Loki

export default async (req: NowRequest, res: NowResponse) => {
  const { q, offset: offsetStr, limit: limitStr, sort, order } = Record({
    q: String,
    offset: String,
    limit: String.Or(Undefined),
    sort: String.Or(Undefined),
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
  const qSearch = new QSearch({
    schema: {
      codePoint: { type: 'number' },
      frequency: { type: 'number' },
      type: { isAny: false },
      description: {},
      hint: {},
      alt: { isAny: false },
      code: {}
    }
  })

  const cond = qSearch.parse(q).cond

  const count = col.count(cond)
  let c = col.chain().find(cond)

  if (sort) {
    c = c.simplesort(sort, { desc: order === 'desc' })
  } else {
    c = c.simplesort('frequency', { desc: true })
  }

  const data = c.offset(offset).limit(limit).data()

  res.json({ count, data })
}
