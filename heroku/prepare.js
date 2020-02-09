const fs = require('fs')
const glob = require('glob')

const { spawnSafe } = require('./utils')

;(async () => {
  await spawnSafe('git', [
    'checkout',
    'heroku'
  ])

  await spawnSafe('git', [
    'worktree',
    'add',
    'heroku-dist',
    'heroku'
  ])

  await spawnSafe('git', ['rm', '-rf', '.'])

  glob.sync('**/*', {
    cwd: 'heroku/public'
  }, (f) => {
    fs.copyFileSync(`heroku/public/${f}`, `heroku-dist/${f}`)
  })

  const pkg = require('../packages/server/package.json')

  delete pkg.devDependencies
  delete pkg.scripts.build

  fs.writeFileSync('./heroku-dist/package.json', JSON.stringify(pkg, null, 2))
  await spawnSafe('yarn', [], {
    stdio: 'inherit'
  })
})().catch(console.error)
