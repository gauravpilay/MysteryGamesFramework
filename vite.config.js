import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/google': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        secure: true,
        headers: {
          Referer: 'https://simplee5.com/',
          Origin: 'https://simplee5.com'
        }
      }
    }
  },
  build: {
    // Increase the warning threshold since we have several large features
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — loaded first, heavily cached
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Firebase — large SDK, rarely changes
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],

          // Three.js + React Three Fiber — only needed for 3D nodes
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],

          // ReactFlow — only needed in Editor
          'vendor-reactflow': ['reactflow', 'dagre'],

          // Framer Motion — used everywhere but can be split from core
          'vendor-motion': ['framer-motion'],

          // Export utilities — only needed on demand
          'vendor-export': ['jszip', 'jspdf', 'jspdf-autotable', 'docx'],

          // Lucide icons — large icon set
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})
