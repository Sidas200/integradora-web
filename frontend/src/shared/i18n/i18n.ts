import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'

// Los textos que ve el jugador viven en es.json con claves en inglés (README §7.5).
void i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  resources: { es: { translation: es } },
  interpolation: { escapeValue: false }, // React ya escapa
})

export { i18n }