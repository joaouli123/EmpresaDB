import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ CONFIGURAÇÃO PARA REPLIT - NÃO MODIFICAR!
// Este proxy é ESSENCIAL para o frontend se conectar ao backend
// no ambiente Replit. Mantém .env VITE_API_URL vazio sempre!
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    // Proxy automático: encaminha requisições ao backend (porta 8000)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/subscriptions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/batch': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/stripe': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/cnpj': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/search': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/stats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/etl': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/redoc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})