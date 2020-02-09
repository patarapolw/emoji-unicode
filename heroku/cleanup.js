const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'worktree',
    'remove',
    '-f',
    'heroku-dist'
  ])

  await spawnSafe('git', [
    'branch',
    '-D',
    'heroku'
  ])
})().catch(console.error)
