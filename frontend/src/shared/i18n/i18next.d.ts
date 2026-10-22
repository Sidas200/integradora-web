import 'i18next'
import type es from './es.json'

// Claves tipadas: t('nav.hoem') no compila.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof es }
  }
}