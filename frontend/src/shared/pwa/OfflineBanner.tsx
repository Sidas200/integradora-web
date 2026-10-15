import { useEffect } from 'react'
import { useOnline } from './useOnline'
import { log } from '../lab/logger'
import css from './pwa.module.css'

export function OfflineBanner() {
  const online = useOnline()
  useEffect(() => log('pwa', online ? 'Conexión: EN LÍNEA' : 'Conexión: SIN CONEXIÓN'), [online])
  if (online) return null
  return (
    <div role="status" className={css.offline}>
      Sin conexión. Estás viendo lo último que se guardó; lo que envíes se mandará al volver la red.
    </div>
  )
}
