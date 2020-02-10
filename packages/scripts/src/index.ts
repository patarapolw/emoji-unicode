import fs from 'fs'

import axios from 'axios'
import cheerio from 'cheerio'
import showdown from 'showdown'
import Loki from 'lokijs'

;(async () => {
  const raw = fs.readFileSync('assets/raw.txt', 'utf8')
  const output: {
  [symbol: string]: {
    codePoint: number,
    symbol: string
    code: Record<string, number>
    description: string,
    hint: Set<string>
  }
} = {}

  raw.split(/===/g).map(block => {
    const lines = block.trim().split('\n')
    const entLength = lines.length / 6

    lines.map((_, i) => {
      if (i % 6 === 0) {
        const getAt = (m: number) => lines[m * entLength + (i / 6)]
        const codePoint = getAt(2).codePointAt(0) || getAt(2).charCodeAt(0)

        output[getAt(2)] = {
          codePoint,
          symbol: getAt(2),
          code: {
            [getAt(4)]: 0,
            [getAt(3)]: 2,
            [`&#x${codePoint.toString(16).toUpperCase()};`]: 3,
            [`&#${codePoint};`]: 4
          },
          description: getAt(5),
          hint: new Set()
        }
      }
    })
  })

  let r = await axios.get('https://unicode.org/emoji/charts/full-emoji-list.html')
  console.log('Emoji from unicode web loaded')

  let $ = cheerio.load(r.data)
  $('tr').each((i, tr) => {
    const chars = $('td.chars', tr)[0]
    const name = $('td.name', tr)[0]

    if (chars && name) {
      const c = $(chars).text().trim()
      const codePoint = c.codePointAt(0) || c.charCodeAt(0)
      const description = $(name).text()

      if (output[c]) {
        output[c].hint.add(description)
      } else {
        output[c] = {
          codePoint,
          symbol: c,
          code: {
            [`&#x${codePoint.toString(16).toUpperCase()};`]: 3,
            [`&#${codePoint};`]: 4
          },
          description,
          hint: new Set()
        }
      }
    }
  })

  const mdConverter = new showdown.Converter({
    emoji: true
  })

  r = await axios.get('https://github.com/showdownjs/showdown/wiki/Emojis')
  console.log('Emoji from showdownjs loaded')

  $ = cheerio.load(r.data)
  $('tr', $('table tbody')[0]).each((i, tr) => {
    const $td = $('td', tr)
    const status = $($td[2]).text().trim()
    const text = $($td[1]).text()
    const c = $(mdConverter.makeHtml(text)).text()
    const codePoint = c.codePointAt(0) || c.charCodeAt(0)

    if (status === 'true') {
      if (output[c]) {
        output[c].code[text] = 1
        output[c].hint.add(text)
      } else {
        output[c] = {
          codePoint,
          symbol: c,
          code: {
            [text]: 1,
            [`&#x${codePoint.toString(16).toUpperCase()};`]: 3,
            [`&#${codePoint};`]: 4
          },
          description: text,
          hint: new Set()
        }
      }
    }
  })

  const db = new Loki('output/emoji.loki', {
    autoload: true,
    autosave: true,
    autosaveInterval: 4000,
    autoloadCallback: () => {
      const col = db.addCollection('emoji', {
        unique: ['symbol'],
        indices: ['code', 'description', 'alt', 'hint']
      })

      Object.entries(output).map(([k, v]) => {
        const [code, ...alt] = Object.entries(v.code)
          .sort(([k0, v0], [k1, v1]) => v0 - v1)
          .map(([k0, v0]) => k0)
          .filter(k0 => k0)
        if (!code) {
          delete output[k]
          return
        }

        col.insert({
          ...v,
          code,
          alt,
          hint: Array.from(v.hint)
        })
      })

      db.save()
      db.close()
    }
  })
})().catch(console.error)
