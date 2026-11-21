import { COVER_ART, KEY_ART, MENU_ART, SHOTS, STORY_NIGHT, type ArtImage } from '@/shared/ui/art'

type Cover = { image: ArtImage; position: string }

/** Cover of each post by its coverKey (column news_posts.cover_key), with real images of the game. */
const BY_KEY: Record<string, Cover> = {
  news_announcement: { image: MENU_ART, position: '50% 40%' },
  news_devlog01: { image: SHOTS.forge, position: '40% 40%' },
  news_demo: { image: SHOTS.duel, position: '55% 50%' },
  news_pwa: { image: SHOTS.camp, position: '50% 50%' },
  news_devlog02: { image: SHOTS.island, position: '50% 55%' },
  news_devlog03: { image: SHOTS.combat, position: '50% 50%' },
  news_devlog04: { image: SHOTS.sanctuary, position: '50% 50%' },
  news_devlog05: { image: SHOTS.varn, position: '55% 50%' },
  news_devlog06: { image: SHOTS.cabin, position: '40% 40%' },
  news_devlog07: { image: STORY_NIGHT, position: '50% 45%' },
  news_devlog08: { image: COVER_ART.bridge, position: '50% 50%' },
  news_devlog09: { image: KEY_ART, position: '70% 40%' },
}

/** Fallback for posts without a known coverKey: picked from the slug, so it never changes between visits. */
const FALLBACK: readonly Cover[] = [
  { image: COVER_ART.bridge, position: '50% 50%' },
  { image: COVER_ART.forge, position: '60% 50%' },
  { image: COVER_ART.dusk, position: '75% 40%' },
  { image: COVER_ART.torii, position: '50% 45%' },
  { image: COVER_ART.cliff, position: '30% 50%' },
  { image: COVER_ART.ruins, position: '30% 50%' },
]

export function coverOf(slug: string, coverKey?: string | null): Cover {
  if (coverKey && BY_KEY[coverKey]) return BY_KEY[coverKey]
  return FALLBACK[[...slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % FALLBACK.length]!
}
