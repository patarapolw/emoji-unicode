const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'push',
    'heroku',
    'heroku:master'
  ])
})().catch(console.error)
