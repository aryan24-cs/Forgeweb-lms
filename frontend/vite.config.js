import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
  },
  build: {
    // Aggressive code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor core — React ecosystem (cached long-term)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts are heavy (~200KB) — split into own chunk, only loaded when needed
          'vendor-charts': ['recharts'],
          // UI utilities
          'vendor-ui': ['react-hot-toast', 'lucide-react'],
          // Data/export libs (rarely used, loaded on-demand)
          'vendor-data': ['axios', 'date-fns', 'papaparse', 'xlsx', 'file-saver', 'jspdf', 'jspdf-autotable'],
        },
      },
    },
    // Enable minification with terser for smaller bundles
    target: 'esnext',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependency pre-bundling for dev speed
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hot-toast',
      'lucide-react',
      'recharts',
    ],
  },
})
