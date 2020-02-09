const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, '../../heroku-dist'),
    filename: 'server.js'
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js']
  }
}
