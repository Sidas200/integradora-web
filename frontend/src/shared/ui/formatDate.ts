const longDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

/** "18 de octubre de 2026". The API sends ISO-8601 in UTC; the browser shows local time. */
export function formatLongDate(iso: string): string {
  return longDate.format(new Date(iso))
}