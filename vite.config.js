import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        download: resolve(rootDir, 'download.html'),
      }
    }
  }
})
