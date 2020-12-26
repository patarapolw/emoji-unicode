import fs from 'fs'

import axios from 'axios'
import cheerio from 'cheerio'

const scrape = axios.create({
  transformResponse: (r) => r
})

async function main () {
  const $ = cheerio.load((await scrape.get('https://ascii.cl/htmlcodes.htm')).data)
  const rows: any[] = []

  Array.from($('table.e1 tr.z1')).map((el) => {
    const batch: any[] = []

    Array.from($(el).next('tr').find('td')).map((el0, i) => {
      $(el0).html()!.trim().split('<br>').map((el1, j) => {
        const c = $('<div>').html(el1).text().trim() || undefined
        console.log(c)

        if (c) {
          if (batch[j]) {
            if (i === 2) {
              batch[j].symbol = c
            } else if (i === 4) {
              batch[j].html = c
            } else if (i === 5) {
              batch[j].description = c
            }
          }

          if (i === 0) {
            batch[j] = {
              ascii: parseInt(c)
            }
          }
        }
      })
    })

    rows.push(...batch)
  })

  fs.writeFileSync('raw/htmlcodes.json', JSON.stringify(
    rows.filter((r) => r.symbol),
    null, 2
  ))
}

main()
