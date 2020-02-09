import { NowRequest, NowResponse } from '@now/node'

export default function (req: NowRequest, res: NowResponse) {
  const { name = 'World' } = req.query
  res.send(`Hello ${name}!`)
}
