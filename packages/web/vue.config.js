// const dotenv = require('dotenv')
// dotenv.config({
//   path: '../server/.env'
// })

// process.env.VUE_APP_AUTH0_DOMAIN = process.env.AUTH0_DOMAIN
// process.env.VUE_APP_AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID
// process.env.VUE_APP_AUTH0_CALLBACK_URL = process.env.AUTH0_CALLBACK_URL
// process.env.VUE_APP_AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE

module.exports = {
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
