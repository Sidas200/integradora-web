import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Lee .env, .env.local y .env.[mode].local de esta carpeta (los *.local no se suben a git).
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.API_ORIGIN ?? 'http://localhost:8080'

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
        manifest: {
          id: '/',
          name: 'The Day I Made That Promise',
          short_name: 'The Promise',
          description: 'Tu progreso, tus logros y las noticias del juego.',
          lang: 'es-MX',
          start_url: '/app?source=pwa',
          scope: '/',
          display: 'standalone',
          background_color: '#F3F9FE',
          theme_color: '#A9D6F5',
          categories: ['games', 'entertainment'],
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
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