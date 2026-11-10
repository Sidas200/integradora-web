import { useOnline } from '@/shared/pwa/useOnline'
import { useSession } from './session'

/**
 * True when changes cannot reach the server: read-only mode (status 'offline') or a browser without
 * network. The buttons that write are disabled instead of failing after the player filled the form.
 */
export function useReadOnly(): boolean {
  const { status } = useSession()
  const online = useOnline()
  return status === 'offline' || !online
}