module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Add custom rules here
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_|^next$|^options$|^handler$',
      varsIgnorePattern: '^_|^server$'
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off',
    'no-useless-escape': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
}; 