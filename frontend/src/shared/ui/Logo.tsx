import { LOGO_MARK } from './art'

/** Brand mark: the crimson moon-blade on its night square. Decorative (the text next to it names the game). */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <img
      src={LOGO_MARK}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ borderRadius: Math.max(3, Math.round(size * 0.12)), flex: 'none' }}
    />
  )
}
