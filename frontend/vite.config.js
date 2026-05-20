import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const hubTarget = env.VITE_HUB_TARGET ?? process.env.VITE_HUB_TARGET ?? "http://localhost:7071"

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/hub": {
          target: hubTarget,
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
  }
})
