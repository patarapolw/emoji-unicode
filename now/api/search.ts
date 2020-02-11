import { NowRequest, NowResponse } from '@now/node'
import { String, Undefined, Record } from 'runtypes'
import Loki from 'lokijs'
import lunr from 'lunr'

let db: Loki
let idx: lunr.Index

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
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
  const end = offset + limit

  if (!db) {
    await new Promise(resolve => {
      db = new Loki(`${__dirname}/emoji.loki`, {
        autoload: true,
        autoloadCallback: resolve
      })
    })
  }

  const col = db.getCollection('emoji')
  if (!idx) {
    idx = lunr(function () {
      this.ref('$loki')
      this.field('symbol', { boost: 10 })
      this.field('codePoint')
      this.field('frequency')
      this.field('type')
      this.field('description', { boost: 5 })
      this.field('hint', { boost: 5 })
      this.field('alt', { boost: 5 })
      this.field('code', { boost: 3 })

      col.data.map((d) => {
        this.add(d)
      })
    })
  }

  if (q) {
    const result = idx.search((![' ', ':'].some(c => q.includes(c)) ? `*${q}*` : q))

    const count = result.length
    const data = result
      .map((r) => ({ ...r, doc: col.get(parseInt(r.ref)) }))
      .sort((p1, p2) => (sort ? (() => {
        const v1 = p1.doc[sort] || 0
        const v2 = p2.doc[sort] || 0
        if (typeof v1 === typeof v2) {
          if (typeof v1 === 'string') {
            return v1.localeCompare(v2)
          } else {
            return v1 - v2
          }
        }
        return typeof v1 === 'string' ? 1 : -1
      })() : p2.score - p1.score) * (order === 'desc' ? -1 : 1))
      .slice(offset, end)
      .map(p => ({
        frequency: 0,
        ...p.doc
      }))

    res.json({ data, count })
  } else {
    const result = col.data
    const count = result.length
    const data = result
      .map((r) => ({ doc: r }))
      .sort((p1, p2) => (sort ? (() => {
        const v1 = p1.doc[sort] || 0
        const v2 = p2.doc[sort] || 0
        if (typeof v1 === typeof v2) {
          if (typeof v1 === 'string') {
            return v1.localeCompare(v2)
          } else {
            return v1 - v2
          }
        }
        return typeof v1 === 'string' ? 1 : -1
      })() : 0) * (order === 'desc' ? -1 : 1))
      .slice(offset, end)
      .map(p => ({
        frequency: 0,
        ...p.doc
      }))

    res.json({ data, count })
  }
}
