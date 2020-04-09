import fs from 'fs'

import axios from 'axios'
import cheerio from 'cheerio'
import showdown from 'showdown'
import { Db } from 'liteorm'
import tb from '../api/_db/local'

;(async () => {
  const db = new Db('api/unicode.db')
  await db.init(Object.values(tb))

  const htmlcodes = JSON.parse(fs.readFileSync('raw/htmlcodes.json', 'utf8')) as {
    ascii: number
    symbol: string
    html?: string
    description?: string
  }[]

  for (const hc of htmlcodes) {
    const id = await db.create(tb.unicode)({
      ascii: hc.ascii,
      symbol: hc.symbol,
      description: hc.description
    })

    if (hc.html) {
      await db.create(tb.repr)({
        repr: hc.html,
        unicodeId: id
      })
    }
  }

  const emoji = JSON.parse(fs.readFileSync('raw/unicode.json', 'utf8'))

  for (const [k, description] of Object.entries<string>(emoji)) {
    const codePoint = parseInt(k.split('-')[1], 16)

    try {
      await db.create(tb.unicode)({
        ascii: codePoint,
        symbol: String.fromCodePoint(codePoint),
        description,
        type: 'emoji'
      })
    } catch (_) {
      const entry = (await db.first(tb.unicode)({ ascii: codePoint }, {
        ascii: tb.unicode.c.ascii,
        symbol: tb.unicode.c.symbol,
        description: tb.unicode.c.description
      }))!

      await db.update(tb.unicode)({ ascii: codePoint }, {
        description: entry.description ? entry.description + '\n' + description : description,
        type: 'emoji'
      })
    }
  }

  const mdConverter = new showdown.Converter({
    emoji: true
  })

  const r = await axios.get('https://github.com/showdownjs/showdown/wiki/Emojis')
  console.log('Emoji from showdownjs loaded')

  const $ = cheerio.load(r.data)
  for (const tr of Array.from($('tr', $('table tbody')[0]))) {
    const $td = $('td', tr)
    const status = $($td[2]).text().trim()
    const text = $($td[1]).text()
    const c = $(mdConverter.makeHtml(text)).text()
    const codePoint = c.codePointAt(0) || c.charCodeAt(0)

    if (status === 'true') {
      try {
        await db.create(tb.unicode)({
          ascii: codePoint,
          symbol: c,
          description: text,
          type: 'emoji'
        })
      } catch (_) {
        const entry = (await db.first(tb.unicode)({ ascii: codePoint }, {
          ascii: tb.unicode.c.ascii,
          symbol: tb.unicode.c.symbol,
          description: tb.unicode.c.description
        }))!

        await db.update(tb.unicode)({ ascii: codePoint }, {
          description: entry.description ? entry.description + '\n' + text : text,
          type: 'emoji'
        })
      }

      const entry = (await db.first(tb.unicode)({ ascii: codePoint }, {
        id: tb.unicode.c.id,
        ascii: tb.unicode.c.ascii,
        symbol: tb.unicode.c.symbol
      }))!

      try {
        await db.create(tb.repr)({
          repr: text,
          unicodeId: entry.id!
        })
      } catch (e) {
        console.log(text)
      }
    }
  }

  await Promise.all(fs.readFileSync('raw/freq.txt', 'utf8').split('\n').map(async (el) => {
    const [f, txt] = el.split('\t')
    for (const c of txt) {
      if (c.trim()) {
        await db.update(tb.unicode)({
          symbol: c
        }, {
          frequency: 1 / parseInt(f)
        })
      }
    }
  }))

  await db.close()
})().catch(console.error)
