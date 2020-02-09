import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

;(async () => {
  const app = express()
  app.use(helmet())
  app.use(morgan('combined'))

  if (process.env.NODE_ENV === 'development') {
    app.use(require('cors')())
  }

  app.use(express.static('./dist'))

  app.listen(3001, () => {
    console.log('listening on port 3001')
  })
})().catch(console.error)
