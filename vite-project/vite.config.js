import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: true
  },
  preview: {
    host: true,
    strictPort: true,
    allowedHosts: [
      'hostelgo-flgw.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  }
})