import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/subscriptions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/batch': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/stripe': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/cnpj': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/search': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/stats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/etl': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        secure: false,
        timeout: 60000,
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/redoc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})