import shlex from 'shlex'
import escapeRegexp from 'escape-string-regexp'

export default function getCond (
  q: string,
  schema?: Record<string, {
    type?: 'string' | 'number'
    isAny?: boolean
  }>
) {
  return {
    $and: shlex.split(q).map((el) => {
      const [op] = /^[-+?]/.exec(el) || [] as string[]
      if (op) {
        el = el.substr(1)
      }

      function addOp (k: string, opK: string, v: any) {
        if (v && schema) {
          if (schema[k].type === 'number') {
            v = parseFloat(v)
          }
        }

        if (op === '+') {
          return { [k]: v }
        } else if (op === '-') {
          if (typeof v === 'number' && opK === '>') {
            v = { [k]: { $lte: v } }
          } else if (typeof v === 'number' && opK === '<') {
            v = { [k]: { $gte: v } }
          } else {
            v = { $ne: v }
          }

          return { [k]: v }
        } else {
          if (typeof v === 'string') {
            v = { [k]: { $regex: new RegExp(escapeRegexp(v), 'i') } }
          } else if (typeof v === 'number' && opK === '>') {
            v = { [k]: { $gt: v } }
          } else if (typeof v === 'number' && opK === '<') {
            v = { [k]: { $lt: v } }
          } else {
            v = { [k]: v }
          }

          if (op === '?') {
            return { $or: [{}, v] }
          } else {
            return v
          }
        }
      }

      const [k, opK, v] = el.split(/([:><])(.+)/)

      if (v) {
        return addOp(k, opK, v)
      } else if (schema) {
        return {
          $or: Object.keys(schema)
            .filter((k0) => !schema[k0].type || schema[k0].type === 'string')
            .filter((k0) => schema[k0].isAny !== false)
            .map((k0) => addOp(k0, opK, k))
        }
      } else {
        return {}
      }
    })
  }
}
