const { spawn } = require('child_process')

const onDeath = require('death')

;(async () => {
  const server = spawn('yarn', ['build', '--watch'], {
    cwd: 'packages/server',
    stdio: 'inherit'
  })

  const web = spawn('yarn', ['build', '--watch'], {
    cwd: 'packages/web',
    stdio: 'inherit'
  })

  onDeath(() => {
    server.kill()
    web.kill()
  })
})().catch(console.error)
