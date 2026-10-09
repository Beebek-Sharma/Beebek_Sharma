import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/public/*.pdf', '**/*.pdf'],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion/react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        resume: 'resume.html',
        tools: 'tools.html',
      },
    },
  },
})
