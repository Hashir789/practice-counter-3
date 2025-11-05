import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://d1tdizimiz2qsf.cloudfront.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep /api in the path
        ws: true, // Enable WebSocket proxying
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/**/*'],
    // Use threads pool on Windows to avoid EPERM errors
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
    // Increase timeout for Windows
    testTimeout: 10000,
  },
})
