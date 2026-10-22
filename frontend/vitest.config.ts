import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Configuración separada de vite.config.ts para no cargar el plugin PWA en las pruebas.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
})