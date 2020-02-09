import { Router } from 'express'
import escapeRegExp from 'escape-string-regexp'
import { String } from 'runtypes'

import { EntryModel } from '../db'
import secured from '../middleware/secured'

const apiRouter = Router()

apiRouter.get('/search', async (req, res, next) => {
  try {
    const q = String.check(req.query.q)
    const offset = parseInt(String.check(req.query.offset)) || 0
    const limit = parseInt(req.query.limit) || 5
    const sort = String.check(req.query.sort)
    const order = req.query.order

    const count = await EntryModel.find({
      $or: ['symbol', 'description', 'hint'].map((k) => ({
        [k]: new RegExp(escapeRegExp(q), 'i')
      }))
    }).countDocuments()

    const data = await EntryModel.find({
      $or: ['symbol', 'description', 'hint'].map((k) => ({
        [k]: new RegExp(escapeRegExp(q))
      }))
    }).sort({
      [sort]: order === 'desc' ? -1 : 1
    }).skip(offset).limit(limit)

    res.json({
      data,
      count
    })
  } catch (e) {
    next(e)
  }
})

apiRouter.get('/status', secured, (req, res) => {
  res.sendStatus(200)
})

apiRouter.put('/like', secured, async (req, res, next) => {
  try {
    const id = String.check(req.query.id)
    const user = String.check(req.query.user)

    await EntryModel.findByIdAndUpdate(id, {
      $addToSet: { like: user }
    })

    res.sendStatus(201)
  } catch (e) {
    next(e)
  }
})

apiRouter.delete('/unlike', secured, async (req, res, next) => {
  try {
    const id = String.check(req.query.id)
    const user = String.check(req.query.user)

    await EntryModel.findByIdAndUpdate(id, {
      $pull: { like: user }
    })

    res.sendStatus(201)
  } catch (e) {
    next(e)
  }
})

export default apiRouter
