const path = require('path');

module.exports = {
  extends: ['../../.eslintrc.common'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.json'),
  },
  rules: {
    'no-console': 'off',
  },
};
