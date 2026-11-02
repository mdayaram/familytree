import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this repo at /familytree/ (http://noj.cc/familytree/).
  base: command === 'build' ? '/familytree/' : '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
