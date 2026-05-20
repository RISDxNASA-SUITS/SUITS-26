import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/hub": {
        target: process.env.VITE_HUB_PROXY_TARGET ?? "http://localhost:7071",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/hub/, ""),
      },
      "/nav": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nav/, ""),
      },
    },
  },
})
