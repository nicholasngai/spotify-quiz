const path = require('path');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.resolve(__dirname, 'client/tsconfig.json'),
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'none',
      },
    ],
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'react/react-in-jsx-scope': 'off',
  },
};
