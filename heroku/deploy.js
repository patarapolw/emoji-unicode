const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'add',
    '.'
  ], {
    cwd: 'heroku-dist'
  })

  await spawnSafe('git', [
    'commit',
    '--allow-empty',
    '-m',
    'Push to Heroku'
  ], {
    cwd: 'heroku-dist'
  })

  await spawnSafe('git', [
    'push',
    '-f',
    'heroku',
    'heroku:master'
  ])
})().catch(console.error)
