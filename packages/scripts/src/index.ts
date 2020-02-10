import fs from 'fs'
import axios from 'axios'
import cheerio from 'cheerio'
import showdown from 'showdown'
import yaml from 'js-yaml'

;(async () => {
  const raw = fs.readFileSync('assets/raw.txt', 'utf8')
  const output: {
  [symbol: string]: {
    charCode: number,
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
        const charCode = getAt(2).charCodeAt(0)

        output[getAt(2)] = {
          charCode,
          symbol: getAt(2),
          code: {
            [getAt(4)]: 0,
            [getAt(3)]: 2,
            [`&#x${charCode.toString(16).toUpperCase()};`]: 3,
            [`&#${charCode};`]: 4
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
      const charCode = c.charCodeAt(0)
      const description = $(name).text()

      if (output[c]) {
        output[c].hint.add(description)
      } else {
        output[c] = {
          charCode,
          symbol: c,
          code: {
            [`&#x${charCode.toString(16).toUpperCase()};`]: 3,
            [`&#${charCode};`]: 4
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
    const charCode = c.charCodeAt(0)

    if (status === 'true') {
      if (output[c]) {
        output[c].code[text] = 1
        output[c].hint.add(text)
      } else {
        output[c] = {
          charCode,
          symbol: c,
          code: {
            [text]: 1,
            [`&#x${charCode.toString(16).toUpperCase()};`]: 3,
            [`&#${charCode};`]: 4
          },
          description: text,
          hint: new Set()
        }
      }
    }
    // else {
    //   if (output[c]) {
    //     output[c].code = text
    //     output[c].alt = new Set([...output[c].alt, ...alt])
    //   } else {
    //     output[c] = {
    //       symbol: c,
    //       code: text,
    //       alt,
    //       description: '',
    //       hint: []
    //     }
    //   }
    // }
  })

  Object.entries(output).map(([k, v]) => {
    const [code, ...alt] = Object.entries(v.code).sort(([k0, v0], [k1, v1]) => v0 - v1).map(([k0, v0]) => k0)
    if (!code) {
      delete output[k]
      return
    }

    ;(v as any).code = code
    ;(v as any).alt = alt
    ;(v as any).hint = Array.from(v.hint)
  })

  fs.writeFileSync('output/codes.yaml', yaml.safeDump(output))
})().catch(console.error)
