// ESLint 9 (flat config). Se queda en 9 hasta que eslint-plugin-jsx-a11y soporte ESLint 10.
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'src/shared/api/schema.d.ts']),

  // Aplicación (navegador)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Estructura modular (README §4.4 y §9.2)
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['**/features/**', '@/features/**'], message: 'shared/ no puede importar de features/.' }],
      }],
    },
  },
  // Service Worker
  {
    files: ['src/sw.ts'],
    languageOptions: { globals: globals.serviceworker },
  },

  // Archivos de configuración y scripts de Node
  {
    files: ['*.{js,ts,mjs}', 'scripts/**/*.{js,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  // lab-evidence.mjs ejecuta código dentro de la página con Playwright (page.evaluate)
  {
    files: ['scripts/lab-evidence.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
