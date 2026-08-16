import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

/** Node globals the repo's plain-JS scripts (build.mjs) rely on. */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  __filename: 'readonly',
  __dirname: 'readonly',
  Buffer: 'readonly',
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['lib/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['*.mjs'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
)
