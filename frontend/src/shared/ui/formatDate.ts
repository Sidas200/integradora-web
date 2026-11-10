const longDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

/** "18 de octubre de 2026". The API sends ISO-8601 in UTC; the browser shows local time. */
export function formatLongDate(iso: string): string {
  return longDate.format(new Date(iso))
}

/** "18 oct 2026, 19:58": for sessions and history, where the hour matters. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}