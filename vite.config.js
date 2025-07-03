import { defineConfig } from 'vite'
import fs from 'fs'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/notificationHub': {
        target: 'https://localhost:5076',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
}) 