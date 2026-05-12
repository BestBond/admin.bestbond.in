import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('formik')) return 'vendor-formik'
          if (id.includes('axios')) return 'vendor-axios'
          if (id.includes('sweetalert2')) return 'vendor-swal'
          if (id.includes('react-select')) return 'vendor-select'
          return 'vendor'
        },
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
})
