import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

;(async () => {
  const app = express()
  const port = process.env.PORT || '3001s'

  app.use(helmet())
  app.use(morgan('combined'))

  if (process.env.NODE_ENV === 'development') {
    app.use(require('cors')())
  }

  app.use(express.static('./web'))

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
})().catch(console.error)
