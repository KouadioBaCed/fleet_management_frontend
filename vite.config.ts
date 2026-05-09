import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['random-examination-procedures-say.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://192.168.68.186:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://192.168.68.186:8000',
        ws: true,
      },
    },
  },
})
