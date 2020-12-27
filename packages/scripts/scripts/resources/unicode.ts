import fs from 'fs'

import axios from 'axios'
import cheerio from 'cheerio'

const scrape = axios.create({
  transformResponse: (r) => r
})

async function main () {
  const $ = cheerio.load((await scrape.get('https://apps.timwhitlock.info/emoji/tables/unicode')).data)
  const rows: any = {}

  Array.from($('table tbody')).map((tbody) => {
    Array.from($('tr', tbody)).map((tr) => {
      const id = $(tr).attr('id')!.trim()
      if (id) {
        if (rows[id]) {
          console.log(id)
        }

        rows[id] = $('td.name', tr).text().trim()
      }
    })
  })

  fs.writeFileSync('raw/unicode.json', JSON.stringify(
    rows,
    null, 2
  ))
}

main()
