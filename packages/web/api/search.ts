import { NowRequest, NowResponse } from '@now/node'
import DataStore from 'nedb-promises'
import path from 'path'
import { String, Undefined } from 'runtypes'
import escapeRegExp from 'escape-string-regexp'

const db = new DataStore(path.join(__dirname, 'db.json'))

export default async (req: NowRequest, res: NowResponse) => {
  const q = String.check(req.query.q)
  const offset = parseInt(String.check(req.query.offset)) || 0
  const limit = parseInt(String.Or(Undefined).check(req.query.limit) || '') || 5
  const sort = String.check(req.query.sort)
  const order = req.query.order

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
  }).skip(offset).limit(limit)

  res.json({
    data,
    count
  })
}
