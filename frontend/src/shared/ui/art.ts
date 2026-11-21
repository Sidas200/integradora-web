/**
 * Pixel-art illustrations (src/assets/art). Each big image has two widths so phones and small cards
 * download the light one; the browser picks with srcset + sizes. Images are not precached: the service
 * worker keeps them in the "images" runtime cache (CacheFirst) after the first visit.
 */
import cloudsDark1586 from '@/assets/art/clouds-dark-1586.webp'
import cloudsDark800 from '@/assets/art/clouds-dark-800.webp'
import cloudsLight1586 from '@/assets/art/clouds-light-1586.webp'
import cloudsLight800 from '@/assets/art/clouds-light-800.webp'
import farDark1586 from '@/assets/art/far-dark-1586.webp'
import farDark800 from '@/assets/art/far-dark-800.webp'
import farLight1586 from '@/assets/art/far-light-1586.webp'
import farLight800 from '@/assets/art/far-light-800.webp'
import coverBridge387 from '@/assets/art/cover-bridge-387.webp'
import coverBridge774 from '@/assets/art/cover-bridge-774.webp'
import coverCliff387 from '@/assets/art/cover-cliff-387.webp'
import coverCliff774 from '@/assets/art/cover-cliff-774.webp'
import coverDusk1730 from '@/assets/art/cover-dusk-1730.webp'
import coverDusk800 from '@/assets/art/cover-dusk-800.webp'
import coverForge385 from '@/assets/art/cover-forge-385.webp'
import coverForge771 from '@/assets/art/cover-forge-771.webp'
import coverRuins1557 from '@/assets/art/cover-ruins-1557.webp'
import coverRuins778 from '@/assets/art/cover-ruins-778.webp'
import coverTorii385 from '@/assets/art/cover-torii-385.webp'
import coverTorii771 from '@/assets/art/cover-torii-771.webp'
import emblem from '@/assets/art/emblem.webp'
import firefly from '@/assets/art/firefly.png'
import hikariPortrait400 from '@/assets/art/hikari-portrait-400.webp'
import hikariPortrait620 from '@/assets/art/hikari-portrait-620.webp'
import hikari from '@/assets/art/hikari.webp'
import hexLogo from '@/assets/art/hex-logo.png'
import hexMark from '@/assets/art/hex-mark.png'
import hexWordmark from '@/assets/art/hex-wordmark.png'
import forestDark1086 from '@/assets/art/forest-dark-1086.webp'
import forestDark2172 from '@/assets/art/forest-dark-2172.webp'
import forestLight1086 from '@/assets/art/forest-light-1086.webp'
import forestLight2172 from '@/assets/art/forest-light-2172.webp'
import islandDark1586 from '@/assets/art/island-dark-1586.webp'
import islandDark800 from '@/assets/art/island-dark-800.webp'
import islandLight1586 from '@/assets/art/island-light-1586.webp'
import islandLight800 from '@/assets/art/island-light-800.webp'
import keyArt1586 from '@/assets/art/key-art-1586.webp'
import keyArt800 from '@/assets/art/key-art-800.webp'
import lantern from '@/assets/art/lantern.png'
import logoMark from '@/assets/art/logo-mark.png'
import lost1586 from '@/assets/art/lost-1586.webp'
import lost800 from '@/assets/art/lost-800.webp'
import nearDark1586 from '@/assets/art/near-dark-1586.webp'
import nearDark800 from '@/assets/art/near-dark-800.webp'
import nearLight1586 from '@/assets/art/near-light-1586.webp'
import nearLight800 from '@/assets/art/near-light-800.webp'
import petal from '@/assets/art/petal.png'
import researcherPortrait400 from '@/assets/art/researcher-portrait-400.webp'
import researcherPortrait620 from '@/assets/art/researcher-portrait-620.webp'
import researcher from '@/assets/art/researcher.webp'
import skyDark1586 from '@/assets/art/sky-dark-1586.webp'
import skyDark800 from '@/assets/art/sky-dark-800.webp'
import skyLight1586 from '@/assets/art/sky-light-1586.webp'
import skyLight800 from '@/assets/art/sky-light-800.webp'
import storyNight1448 from '@/assets/art/story-night-1448.webp'
import storyNight800 from '@/assets/art/story-night-800.webp'
import tsukiPortrait400 from '@/assets/art/tsuki-portrait-400.webp'
import tsukiPortrait620 from '@/assets/art/tsuki-portrait-620.webp'
import tsuki from '@/assets/art/tsuki.webp'
import wordmark1605 from '@/assets/art/wordmark-1605.webp'
import wordmark900 from '@/assets/art/wordmark-900.webp'

// Game media: real screenshots, the intro panels and the menu art (from the build and the trailer)
import shotIsland800 from '@/assets/art/shot-island-800.webp'
import shotIsland1600 from '@/assets/art/shot-island-1600.webp'
import shotCabin800 from '@/assets/art/shot-cabin-800.webp'
import shotCabin1600 from '@/assets/art/shot-cabin-1600.webp'
import shotCombat800 from '@/assets/art/shot-combat-800.webp'
import shotCombat1600 from '@/assets/art/shot-combat-1600.webp'
import shotForge800 from '@/assets/art/shot-forge-800.webp'
import shotForge1600 from '@/assets/art/shot-forge-1600.webp'
import shotCamp800 from '@/assets/art/shot-camp-800.webp'
import shotCamp1600 from '@/assets/art/shot-camp-1600.webp'
import shotSanctuary800 from '@/assets/art/shot-sanctuary-800.webp'
import shotSanctuary1600 from '@/assets/art/shot-sanctuary-1600.webp'
import shotVarn800 from '@/assets/art/shot-varn-800.webp'
import shotVarn1600 from '@/assets/art/shot-varn-1600.webp'
import shotDuel800 from '@/assets/art/shot-duel-800.webp'
import shotDuel1600 from '@/assets/art/shot-duel-1600.webp'
import legend1_600 from '@/assets/art/legend-1-600.webp'
import legend1_1200 from '@/assets/art/legend-1-1200.webp'
import legend2_600 from '@/assets/art/legend-2-600.webp'
import legend2_1200 from '@/assets/art/legend-2-1200.webp'
import legend3_600 from '@/assets/art/legend-3-600.webp'
import legend3_1200 from '@/assets/art/legend-3-1200.webp'
import legend4_600 from '@/assets/art/legend-4-600.webp'
import legend4_1200 from '@/assets/art/legend-4-1200.webp'
import legend5_600 from '@/assets/art/legend-5-600.webp'
import legend5_1200 from '@/assets/art/legend-5-1200.webp'
import legend6_600 from '@/assets/art/legend-6-600.webp'
import legend6_1200 from '@/assets/art/legend-6-1200.webp'
import menuKeyArt800 from '@/assets/art/menu-key-art-800.webp'
import menuKeyArt1600 from '@/assets/art/menu-key-art-1600.webp'
import varnBust from '@/assets/art/varn-466.webp'
import tsukiArt600 from '@/assets/art/tsuki-art-600.webp'
import tsukiArt1122 from '@/assets/art/tsuki-art-1122.webp'

export interface ArtImage {
  src: string
  srcSet: string
}

const pair = (small: string, smallW: number, big: string, bigW: number): ArtImage => ({
  src: big,
  srcSet: `${small} ${smallW}w, ${big} ${bigW}w`,
})

/** Layers of the floating-islands scene, back to front. All share the same 1586 × 992 canvas, so they line up. */
export const SCENE = {
  light: {
    sky: pair(skyLight800, 800, skyLight1586, 1586),
    far: pair(farLight800, 800, farLight1586, 1586),
    island: pair(islandLight800, 800, islandLight1586, 1586),
    near: pair(nearLight800, 800, nearLight1586, 1586),
    clouds: pair(cloudsLight800, 800, cloudsLight1586, 1586),
  },
  dark: {
    sky: pair(skyDark800, 800, skyDark1586, 1586),
    far: pair(farDark800, 800, farDark1586, 1586),
    island: pair(islandDark800, 800, islandDark1586, 1586),
    near: pair(nearDark800, 800, nearDark1586, 1586),
    clouds: pair(cloudsDark800, 800, cloudsDark1586, 1586),
  },
} as const

export const STORY_NIGHT = pair(storyNight800, 800, storyNight1448, 1448)
export const FOREST = {
  light: pair(forestLight1086, 1086, forestLight2172, 2172),
  dark: pair(forestDark1086, 1086, forestDark2172, 2172),
} as const
export const KEY_ART = pair(keyArt800, 800, keyArt1586, 1586)
export const SPRITE = { petal, firefly, lantern } as const

/** Game logo ("The Day I Made That Promise" wordmark) and the small mark used in the header. */
export const WORDMARK = pair(wordmark900, 900, wordmark1605, 1605)
export const LOGO_MARK = logoMark
/** Hex Studio: full logo (mark over "Hex"), the mark alone and the word alone. Pink on transparent. */
export const HEX = { logo: hexLogo, mark: hexMark, wordmark: hexWordmark } as const

/** Crimson sword over the crescent moon: back of the character cards. */
export const EMBLEM = emblem

/** Cast: full-body pixel sprite and illustrated portrait. */
export const CHARACTERS = {
  tsuki: { sprite: tsuki, portrait: pair(tsukiPortrait400, 400, tsukiPortrait620, 620) },
  hikari: { sprite: hikari, portrait: pair(hikariPortrait400, 400, hikariPortrait620, 620) },
  researcher: { sprite: researcher, portrait: pair(researcherPortrait400, 400, researcherPortrait620, 620) },
} as const
export type CharacterId = keyof typeof CHARACTERS

/** Broken torii under a dead cherry tree: the 404 and route-error screens. */
export const LOST = pair(lost800, 800, lost1586, 1586)

/** News covers (scenes of the islands). */
export const COVER_ART = {
  bridge: pair(coverBridge387, 387, coverBridge774, 774),
  forge: pair(coverForge385, 385, coverForge771, 771),
  cliff: pair(coverCliff387, 387, coverCliff774, 774),
  torii: pair(coverTorii385, 385, coverTorii771, 771),
  ruins: pair(coverRuins778, 778, coverRuins1557, 1557),
  dusk: pair(coverDusk800, 800, coverDusk1730, 1730),
} as const

/** Real in-game screenshots for the gallery and the game-loop chapters (16:9 / 16:10). */
export const SHOTS = {
  island: pair(shotIsland800, 800, shotIsland1600, 1600),
  cabin: pair(shotCabin800, 800, shotCabin1600, 1600),
  combat: pair(shotCombat800, 800, shotCombat1600, 1600),
  forge: pair(shotForge800, 800, shotForge1600, 1600),
  camp: pair(shotCamp800, 800, shotCamp1600, 1600),
  sanctuary: pair(shotSanctuary800, 800, shotSanctuary1600, 1600),
  varn: pair(shotVarn800, 800, shotVarn1600, 1600),
  duel: pair(shotDuel800, 800, shotDuel1600, 1600),
} as const
export type ShotId = keyof typeof SHOTS

/** The six panels of the intro cinematic, in order. */
export const LEGEND: readonly ArtImage[] = [
  pair(legend1_600, 600, legend1_1200, 1200),
  pair(legend2_600, 600, legend2_1200, 1200),
  pair(legend3_600, 600, legend3_1200, 1200),
  pair(legend4_600, 600, legend4_1200, 1200),
  pair(legend5_600, 600, legend5_1200, 1200),
  pair(legend6_600, 600, legend6_1200, 1200),
]

/** Main menu illustration with the title (trailer poster, download section). */
export const MENU_ART = pair(menuKeyArt800, 800, menuKeyArt1600, 1600)
/** Varn, Guardian of the Threshold (bust, transparent). */
export const VARN = varnBust
/** Tsuki, full illustration from the main menu (transparent). */
export const TSUKI_ART = pair(tsukiArt600, 600, tsukiArt1122, 1122)

/** Trailer of the demo, served as-is from public/media (not hashed, not precached). */
export const TRAILER_URL = '/media/trailer.mp4'
/** On-screen texts of the trailer as WebVTT captions. */
export const TRAILER_CAPTIONS_URL = '/media/trailer.es.vtt'
