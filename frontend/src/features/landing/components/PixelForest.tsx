import { useTheme } from '@/shared/theme'
import { FOREST } from '@/shared/ui/art'
import css from '../landing.module.css'

/** Cherry-blossom forest with its stream at the foot of "Cómo se juega" (by day or by moonlight). Decorative. */
export function PixelForest() {
  const image = FOREST[useTheme()]
  return (
    <div className={css.forest} aria-hidden="true">
      <img src={image.src} srcSet={image.srcSet} sizes="100vw" alt="" loading="lazy" decoding="async" draggable={false} />
    </div>
  )
}
