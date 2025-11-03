import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/frontend', '')
  const BACKEND_URL = env.BACKEND_API_URL || 'http://72.61.217.143:8000'
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/auth': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/user': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/subscriptions': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/batch': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/stripe': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/cnpj': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/search': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/stats': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/etl': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/ws': {
          target: BACKEND_URL.replace('http', 'ws'),
          ws: true,
          secure: false,
          timeout: 60000,
        },
        '/docs': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/redoc': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
        },
        '/openapi.json': {
          target: BACKEND_URL,
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
  }
})