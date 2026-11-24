import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { securityHeaders, securityHeadersPlugin } from './security-headers.js'

export default defineConfig({
  plugins: [react(), securityHeadersPlugin()],
  server: { host: 'localhost' },
  preview: { host: 'localhost', headers: securityHeaders({ https: false }) },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['gsap', 'lenis', 'framer-motion'],
        },
      },
    },
  },
})
