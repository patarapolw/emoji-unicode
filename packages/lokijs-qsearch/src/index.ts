import shlex from 'shlex'
import escapeRegexp from 'escape-string-regexp'

export function getCond (
  q: string,
  schema?: Record<string, {
    type?: 'string' | 'number'
    isAny?: boolean
    isExact?: boolean
  }>
) {
  return {
    $and: shlex.split(q).map((el) => {
      const [op] = /^[-+?]/.exec(el) || [] as string[]
      if (op) {
        el = el.substr(1)
      }

      function addOp (k: string, v: any) {
        if (v && schema) {
          if (schema[k].type === 'number') {
            v = parseFloat(v)
          }
        }

        if (op === '+') {
          return { [k]: v }
        } else if (op === '-') {
          return { [k]: { $ne: v } }
        } else {
          if (typeof v === 'string') {
            v = { $regex: new RegExp(escapeRegexp(v), 'i') }
          }

          if (op === '?') {
            return { $or: [{}, { [k]: v }] }
          } else {
            return { [k]: v }
          }
        }
      }

      const [k, v] = el.split(/:(.+)/)
      if (v) {
        return addOp(k, v)
      } else if (schema) {
        return { $or: Object.keys(schema).map((k0) => addOp(k0, k)) }
      } else {
        return {}
      }
    })
  }
}
