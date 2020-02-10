import fs from 'fs'

import { NowRequest, NowResponse } from '@now/node'
import yaml from 'js-yaml'
import { Search } from 'js-search'
import { String, Undefined, Record } from 'runtypes'

const db = new Search('symbol')
db.addIndex('symbol')
db.addIndex('code')
db.addIndex('description')
db.addIndex('hint')
db.addDocuments(Object.values(yaml.safeLoad(fs.readFileSync(`${__dirname}/codes.yaml`, 'utf8'))))

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
  const end = offset + (parseInt(limitStr || '') || 5)

  const allData = db.search(q)
  const count = allData.length
  const data = allData
    .sort((a, b) => a.toString().localeCompare(b.toString()) * (order === 'desc' ? -1 : 1))
    .slice(offset, end)

  res.json({ data, count })
}
