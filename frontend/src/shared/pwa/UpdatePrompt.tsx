import { applyUpdate, usePwaState } from './pwaState'
import css from './pwa.module.css'

export function UpdatePrompt() {
  const { needRefresh } = usePwaState()
  if (!needRefresh) return null
  return (
    <div role="status" className={css.update}>
      Hay una versión nueva de la app.
      <button type="button" onClick={applyUpdate}>Actualizar</button>
    </div>
  )
}