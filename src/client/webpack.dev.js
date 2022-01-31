const config = require('./webpack.config');

module.exports = {
  ...config,
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    proxy: {
      '/': 'http://localhost:8080',
    },
  },
};
