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
  background_color: '#F6EEF6',
  theme_color: '#F6EEF6',
  categories: ['games', 'entertainment'],
  icons: [
    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  // Richer install dialog (Chrome on desktop and Android). webp keeps them out of the precache.
  screenshots: [
    { src: '/screenshots/landing-wide.webp', sizes: '1280x720', type: 'image/webp', form_factor: 'wide', label: 'Página principal del juego en escritorio' },
    { src: '/screenshots/landing-narrow.webp', sizes: '390x844', type: 'image/webp', form_factor: 'narrow', label: 'Página principal del juego en el teléfono' },
  ],
  // Long-press on the installed icon (Android, Windows). They open inside /app, so they need a session.
  shortcuts: [
    { name: 'Historial', short_name: 'Historial', description: 'Tus sesiones, logros e hitos', url: '/app/history?source=shortcut', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
    { name: 'Logros', short_name: 'Logros', description: 'Los logros que llevas desbloqueados', url: '/app/achievements?source=shortcut', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
  ],
}