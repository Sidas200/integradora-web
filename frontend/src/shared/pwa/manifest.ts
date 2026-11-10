import type { ManifestOptions } from 'vite-plugin-pwa'

/**
 * Web app manifest (README §8.1). It lives here, apart from vite.config.ts, so the tests can check
 * that every shortcut points to a route that exists.
 */
export const manifest: Partial<ManifestOptions> = {
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
  // Long-press on the installed icon (Android, Windows). They open inside /app, so they need a session.
  shortcuts: [
    { name: 'Historial', short_name: 'Historial', description: 'Tus sesiones, logros e hitos', url: '/app/history?source=shortcut', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
    { name: 'Logros', short_name: 'Logros', description: 'Los logros que llevas desbloqueados', url: '/app/achievements?source=shortcut', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
  ],
}