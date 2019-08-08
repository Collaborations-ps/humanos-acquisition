const prettierOptions = require('./.prettierrc.js')

const isProduction =
  process.env.NODE_ENV === 'production' || process.env.CI === 'true'

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'prettier',
    'prettier/react',
  ],
  env: {
    browser: true,
    jest: true,
    es6: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'prettier', 'json'],
  rules: {
    'prettier/prettier': [1, prettierOptions],
    'no-console': isProduction ? 2 : 1,
    'no-debugger': isProduction ? 2 : 1,
    'react/jsx-no-bind': 2,
    'react/jsx-boolean-value': 2,
    'react/jsx-handler-names': 2,
    'react/jsx-filename-extension': [2, { extensions: ['.js', '.ts', '.tsx'] }],
    'react/jsx-sort-props': [2, { callbacksLast: true }],
    '@typescript-eslint/indent': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/member-delimiter-style': 0,
  },
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
      classes: true,
    },
  },
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', 'server', 'pages', 'assets'],
        extensions: ['.js', '.ts', '.tsx'],
      },
    },
  },
}
