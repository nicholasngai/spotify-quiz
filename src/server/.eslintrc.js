const path = require('path');
const config = require('../../.eslintrc.common.js');

module.exports = {
  ...config,
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.json'),
  },
};
