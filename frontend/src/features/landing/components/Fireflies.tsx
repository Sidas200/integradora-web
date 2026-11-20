import type { CSSProperties } from 'react'
import { SPRITE } from '@/shared/ui/art'
import css from '../landing.module.css'

/** Fireflies (firefly.png) that float and fade (Kamui). Decorative. */
export function Fireflies({ count = 12 }: { count?: number }) {
  return (
    <div className={css.fireflies} aria-hidden="true" style={{ '--firefly-img': `url("${SPRITE.firefly}")` } as CSSProperties}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            '--x': `${(i * 53 + 11) % 100}%`,
            '--y': `${(i * 29 + 17) % 100}%`,
            '--d': `${5 + (i % 4) * 1.5}s`,
            '--delay': `${-(i * 0.7)}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
