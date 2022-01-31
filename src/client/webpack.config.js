const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, '../../build/client/index.js'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../../build/dist'),
  },
};
