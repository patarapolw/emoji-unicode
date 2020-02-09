import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import apiRouter from './api'

dotenv.config()

;(async () => {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })

  const app = express()
  const port = process.env.PORT || '3001'

  app.use(helmet())
  app.use(morgan('dev'))

  app.use(express.static('./web'))

  if (process.env.NODE_ENV === 'development') {
    apiRouter.use(require('cors'))
    app.use('/api', apiRouter)
  }

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
})().catch(console.error)
