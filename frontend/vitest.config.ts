import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Configuración separada de vite.config.ts para no cargar el plugin PWA en las pruebas.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Sin el plugin PWA este módulo virtual no existe; se sustituye por un doble de prueba.
      'virtual:pwa-register': fileURLToPath(new URL('./src/test/virtualPwaRegister.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    // npm run test:coverage → coverage/index.html (y coverage/lcov.info para CI)
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**', // utilidades de prueba (MSW, renderRoute, setup)
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts', // incluye schema.d.ts, generado desde el contrato
        'src/main.tsx', // solo monta <App /> en el DOM
      ],
      reporter: ['text-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
    },
  },
})