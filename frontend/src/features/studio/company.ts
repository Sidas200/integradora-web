/**
 * Company data used by the footer, "Sobre nosotros" and the legal pages. Fictional data for the
 * school project: changing a value here updates every page that shows it.
 */
export const COMPANY = {
  name: 'Hex Studio',
  legalName: 'Hex Studio Kitsune, S. de R.L. de C.V.',
  address: 'Av. Sakura 1108, Col. Hanami, C.P. 31125, Chihuahua, Chihuahua, México',
  city: 'Chihuahua, México',
  contactEmail: 'hola@hexstudio.mx',
  privacyEmail: 'privacidad@hexstudio.mx',
  privacyOfficer: 'Departamento de Privacidad «Mamoru»',
  /** Date shown as "Última actualización" on the legal pages (local noon, so it never shifts a day). */
  legalUpdatedAt: '2026-11-19T12:00:00',
  github: 'https://github.com/Sidas200',
} as const

/** The three products the studio builds, with their public repositories. */
export const PRODUCTS = [
  { id: 'game', repo: 'https://github.com/Sidas200/integradora' },
  { id: 'web', repo: 'https://github.com/Sidas200/integradora-web' },
  { id: 'mobile', repo: 'https://github.com/Sidas200/integradora_movil' },
] as const
