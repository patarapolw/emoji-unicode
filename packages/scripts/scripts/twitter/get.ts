import axios from 'axios'
import fs from 'fs'

const api = axios.create({
  baseURL: 'https://api.twitter.com',
  headers: {
    Authorization: `Bearer ${JSON.parse(fs.readFileSync('token.json', 'utf-8')).access_token}`
  }
})

api.get('/2/tweets/search/recent', {
  params: {
    query: 'python'
  }
}).then(({ data }) => console.log(data)).catch((e) => console.error(e.response))
