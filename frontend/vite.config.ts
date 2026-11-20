import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { manifest } from './src/shared/pwa/manifest.ts'

export default defineConfig(({ command, mode }) => {
  // Lee .env, .env.local y .env.[mode].local de esta carpeta (los *.local no se suben a git).
  const env = loadEnv(mode, process.cwd(), '')
  // 127.0.0.1 en lugar de localhost: Node intenta primero IPv6 (::1) y la API escucha en IPv4.
  const apiOrigin = env.API_ORIGIN ?? 'http://127.0.0.1:8080'
  if (command === 'serve') console.info(`  ➜  API:     /api → ${apiOrigin}`)

  return {
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: false,
        injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
        manifest, // src/shared/pwa/manifest.ts
        devOptions: { enabled: false },
      }),
    ],
    server: {
      port: 5173,
      proxy: { '/api': { target: apiOrigin, changeOrigin: true } },
    },
    preview: { port: 4173 },
  }
})