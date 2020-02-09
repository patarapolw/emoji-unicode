import fs from 'fs'
import yaml from 'js-yaml'

const raw = fs.readFileSync('assets/raw.txt', 'utf8')
const output: {
  [code: string]: {
    symbol: string
    'html-number': string
    'html-name': string
    name: string
  }
} = {}

raw.split(/===/g).map(block => {
  const lines = block.trim().split('\n')
  const entLength = lines.length / 6

  lines.map((_, i) => {
    if (i % 6 === 0) {
      const getAt = (m: number) => lines[m * entLength + (i / 6)]

      output[getAt(0)] = {
        symbol: getAt(2),
        'html-number': getAt(3),
        'html-name': getAt(4),
        name: getAt(5)
      }
    }
  })
})

fs.writeFileSync('output/htmlcodes.yaml', yaml.safeDump(output, { skipInvalid: true }))
