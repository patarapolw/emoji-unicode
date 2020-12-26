import axios from 'axios'
import fs from 'fs'

axios.post('https://api.twitter.com/oauth2/token', 'grant_type=client_credentials', {
  headers: {
    Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  },
}).then((r) => fs.writeFileSync('token.json', JSON.stringify(r.data)))
