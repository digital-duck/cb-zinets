import { defineConfig } from 'vite'

export default defineConfig({
  base: '/cb-zinets/',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
