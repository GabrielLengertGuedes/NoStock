import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Node: a API (server/) e os scripts da raiz nao rodam no navegador.
    files: ['server/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // O Express so reconhece o tratador de erro se ele receber os quatro parametros.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
])
