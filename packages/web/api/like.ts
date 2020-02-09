import { NowRequest, NowResponse } from '@now/node'

export default function (req: NowRequest, res: NowResponse) {
  console.log(req.socket.remoteAddress)
  res.send('Hello!')
}
