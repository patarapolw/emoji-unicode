import fs from 'fs'

import mongoose from 'mongoose'
import yaml from 'js-yaml'
import dotenv from 'dotenv'

import { EntryModel } from '../src/db'
dotenv.config()

;(async () => {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  await Promise.all(Object.values(yaml.safeLoad(fs.readFileSync('../scripts/output/codes.yaml', 'utf8')))
    .map(async (entry) => {
      try {
        await EntryModel.create(entry)
      } catch (e) {
        console.error(e)
        console.error(entry)
      }
    }))
  mongoose.disconnect()
})().catch(console.error)
