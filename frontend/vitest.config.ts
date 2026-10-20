import { defineConfig } from 'vitest/config'

// Configuración separada de vite.config.ts para no cargar el plugin PWA en las pruebas.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
})
