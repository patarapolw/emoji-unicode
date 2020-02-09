const { spawn } = require('child_process')

const onDeath = require('death')

;(async () => {
  const server = spawn('yarn', ['build'], {
    cwd: 'packages/server'
  })

  const web = spawn('yarn', ['build'], {
    cwd: 'packages/web'
  })

  onDeath(() => {
    server.kill()
    web.kill()
  })
})().catch(console.error)
