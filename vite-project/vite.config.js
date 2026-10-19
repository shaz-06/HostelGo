import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'stats.json',
      template: 'raw-data',
    }),
  ],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    watch: {
      ignored: ['**/android/**']
    }
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