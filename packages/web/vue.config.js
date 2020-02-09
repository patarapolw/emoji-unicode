module.exports = {
  outputDir: '../../server/web',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
