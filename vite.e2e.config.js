import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.js'

export default mergeConfig(base, defineConfig({
  build: { outDir: '.cache/e2e-dist' },
  preview: {
    host: '127.0.0.1', port: 4175, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:3002', changeOrigin: true } },
  },
}))
