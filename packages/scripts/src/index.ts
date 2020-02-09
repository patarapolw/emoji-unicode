import fs from 'fs'
import yaml from 'js-yaml'
import axios from 'axios'
import cheerio from 'cheerio'
import showdown from 'showdown'

;(async () => {
  const raw = fs.readFileSync('assets/raw.txt', 'utf8')
  const output: {
  [symbol: string]: {
    charCode: number,
    symbol: string
    code: string
    alt: Set<string>
    description: string,
    hint: string[]
  }
} = {}

  raw.split(/===/g).map(block => {
    const lines = block.trim().split('\n')
    const entLength = lines.length / 6

    lines.map((_, i) => {
      if (i % 6 === 0) {
        const getAt = (m: number) => lines[m * entLength + (i / 6)]
        const c3 = getAt(3)
        const c4 = getAt(4)
        const charCode = getAt(2).charCodeAt(0)

        output[getAt(2)] = {
          charCode,
          symbol: getAt(2),
          code: c4 || c3,
          alt: new Set(c4 ? [c3, c4] : [c3]),
          description: getAt(5),
          hint: []
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
      const alt = new Set([`&#${charCode}`, `&#x${charCode.toString(16).toUpperCase()}`])
      const description = $(name).text()

      if (output[c]) {
        output[c].alt = new Set([...output[c].alt, ...alt])
        output[c].hint.push(description)
      } else {
        output[c] = {
          charCode,
          symbol: c,
          code: `&#${charCode}`,
          alt,
          description,
          hint: []
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
    const alt = new Set([`&#${charCode}`, `&#x${charCode.toString(16).toUpperCase()}`, text])

    if (status === 'true') {
      if (output[c]) {
        output[c].code = text
        output[c].alt = new Set([...output[c].alt, ...alt])
        output[c].hint.push(text)
      } else {
        output[c] = {
          charCode,
          symbol: c,
          code: text,
          alt,
          description: text,
          hint: []
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

  Object.keys(output).map((k) => {
    (output[k] as any).alt = Array.from(output[k].alt)
  })

  fs.writeFileSync('output/codes.yaml', yaml.safeDump(output))
})().catch(console.error)
