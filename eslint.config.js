const { fixupConfigRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');
const typescriptParser = require('@typescript-eslint/parser');
const typescriptRecommended = require('@typescript-eslint/eslint-plugin');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const reactHooks = require('eslint-plugin-react-hooks');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  // Ignores.
  {
    ignores: [
      'build/**',
      '**/.prettierrc.js',
      '**/esbuild.js',
      '**/esbuild.config.js',
      '**/eslint.config.js',
      '**/vite.config.ts',
    ],
  },
  ...fixupConfigRules(compat.extends(
    'airbnb',
    'airbnb-typescript',
    'plugin:import/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  )),
  // Common config.
  {
    files: [
      'client/**',
      'server/**',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: 'client/tsconfig.json',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      jsxA11y,
      reactHooks,
      typescriptRecommended,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
        },
      ],
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
    },
  },
  // Client config.
  {
    files: ['client/**'],
    languageOptions: {
      parserOptions: {
        project: 'client/tsconfig.json',
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
  // Server config.
  {
    files: ['server/**'],
    languageOptions: {
      parserOptions: {
        project: 'server/tsconfig.json',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
