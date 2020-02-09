module.exports = {
  outputDir: '../server',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3001'
      }
    }
  }
}
