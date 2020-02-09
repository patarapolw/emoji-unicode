module.exports = {
  outputDir: '../../heroku-dist/web',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
