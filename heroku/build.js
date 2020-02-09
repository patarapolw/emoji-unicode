const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('yarn', ['build'], {
    cwd: 'packages/server'
  })

  await spawnSafe('yarn', ['build'], {
    cwd: 'packages/web'
  })
})().catch(console.error)
