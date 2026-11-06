import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/file_upload_api': {
        target: 'https://crystalsbusinesssolution.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});