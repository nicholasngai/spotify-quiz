const config = require('./webpack.config');

module.exports = {
  ...config,
  mode: 'development',
  devServer: {
    proxy: {
      '/': 'http://localhost:8080',
    },
  },
};
