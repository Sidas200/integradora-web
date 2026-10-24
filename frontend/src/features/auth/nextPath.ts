const DEFAULT_PATH = '/app'

/**
 * Where to go after logging in (?next=). Only paths of this site: "//evil.com" or
 * "https://evil.com" would turn the login into an open redirect.
 */
export function nextPath(search: string): string {
  const next = new URLSearchParams(search).get('next')
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return DEFAULT_PATH
  if (next === '/login' || next === '/register') return DEFAULT_PATH
  return next
}