const path = require('path')

module.exports = {
  /**
   * 
   * @param {import('webpack-chain')} config 
   */
  chainWebpack: config => {
    config.module
      .rule('yaml')
      .test(/\.yaml$/)
      .use('js-yaml-loader')
        .loader('js-yaml-loader')
        .end()
    
    config.resolve.alias
      .set('~data', path.resolve('../../data'))
  }
}
