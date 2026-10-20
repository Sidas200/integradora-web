const styles = {
  api: 'background:#1D5C9A;color:#fff;padding:1px 6px;border-radius:4px',
  render: 'background:#2E6B45;color:#fff;padding:1px 6px;border-radius:4px',
  pwa: 'background:#B4842A;color:#fff;padding:1px 6px;border-radius:4px',
  error: 'background:#B23447;color:#fff;padding:1px 6px;border-radius:4px',
} as const

type Channel = keyof typeof styles

export function log(channel: Channel, message: string, ...data: unknown[]): void {
  const fn = channel === 'error' ? console.error : console.log
  fn(`%cTDIMP ${channel.toUpperCase()}%c ${message}`, styles[channel], '', ...data)
}

export function logTable(channel: Channel, message: string, rows: object[]): void {
  console.groupCollapsed(`%cTDIMP ${channel.toUpperCase()}%c ${message}`, styles[channel], '')
  console.table(rows)
  console.groupEnd()
}

export const formatBytes = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
