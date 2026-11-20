import type { CSSProperties } from 'react'
import { useTheme } from '@/shared/theme'
import { SCENE, SPRITE, type ArtImage } from './art'
import css from './SkyScene.module.css'

type Variant = 'hero' | 'card' | 'backdrop'

/** Width the layers take on screen, so the browser picks the 800 px or the 1586 px file. */
const SIZES: Record<Variant, string> = {
  hero: '100vw',
  backdrop: '100vw',
  card: '(min-width: 1100px) 60vw, 100vw',
}

/**
 * Sky of floating islands in pixel art, in layers (sky, far peaks, main island, near islets, clouds)
 * so each one moves at its own speed: parallax with the scroll in the landing hero ("Kamui" style)
 * and a gentle bob everywhere else. Only the layers of the active theme are downloaded.
 * `focus` is the object-position shared by every layer (so they stay aligned when the box crops them).
 * Decorative: always aria-hidden. With prefers-reduced-motion everything stays still.
 */
export function SkyScene({ variant = 'hero', petals = 14, focus }: {
  variant?: Variant
  petals?: number
  focus?: string
}) {
  const theme = useTheme()
  const art = SCENE[theme]
  const layer = (image: ArtImage, className: string, eager = false) => (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={SIZES[variant]}
      alt=""
      className={`${css.layer} ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )

  return (
    <div
      className={css.scene}
      data-variant={variant}
      aria-hidden="true"
      style={{ '--focus': focus, '--petal-img': `url("${SPRITE.petal}")` } as CSSProperties}
    >
      {layer(art.sky, css.sky, variant === 'hero')}
      {layer(art.far, css.far)}
      {layer(art.island, css.island, variant === 'hero')}
      {layer(art.near, css.near)}
      {layer(art.clouds, css.front)}

      <div className={css.petals}>
        {Array.from({ length: petals }, (_, i) => (
          <span
            key={i}
            className={css.petal}
            style={{
              '--x': `${(i * 37 + 7) % 100}%`,
              '--d': `${9 + (i % 5) * 2.2}s`,
              '--delay': `${-(i * 1.3)}s`,
              '--s': `${0.5 + (i % 4) * 0.18}`,
              '--drift': `${(i % 2 ? 1 : -1) * (40 + (i % 3) * 30)}px`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
