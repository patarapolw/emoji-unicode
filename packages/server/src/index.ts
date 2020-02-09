import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'

;(async () => {
  const app = express()
  const port = process.env.PORT || '3001'

  app.use(helmet())
  app.use(morgan('combined'))

  app.use(express.static('./web'))

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
})().catch(console.error)
