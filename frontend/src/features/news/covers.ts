import { COVER_ART, KEY_ART, STORY_NIGHT, type ArtImage } from '@/shared/ui/art'

/**
 * Cover picked from the slug, until posts carry their own image (coverKey): scenes of the islands,
 * so the list never looks repeated side by side.
 */
const COVERS: readonly { image: ArtImage; position: string }[] = [
  { image: COVER_ART.bridge, position: '50% 50%' },
  { image: COVER_ART.forge, position: '60% 50%' },
  { image: COVER_ART.dusk, position: '75% 40%' },
  { image: COVER_ART.torii, position: '50% 45%' },
  { image: COVER_ART.cliff, position: '30% 50%' },
  { image: COVER_ART.ruins, position: '30% 50%' },
  { image: KEY_ART, position: '70% 40%' },
  { image: STORY_NIGHT, position: '50% 45%' },
]

export function coverOf(slug: string) {
  return COVERS[[...slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COVERS.length]!
}
