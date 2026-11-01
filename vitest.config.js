import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Sem isto o JSX dos componentes cai no transform antigo, que exige
  // importar o React em todo arquivo.
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/globalSetup.js'],
    setupFiles: ['tests/setup.js'],
    environment: 'node',
    // Os arquivos compartilham a base temporária exclusiva desta execução.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
