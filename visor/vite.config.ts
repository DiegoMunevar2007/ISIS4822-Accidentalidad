import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // Escucha en todas las interfaces y acepta cualquier host (túneles, otros equipos de la red).
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
})
