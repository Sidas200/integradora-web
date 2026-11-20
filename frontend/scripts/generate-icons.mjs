import sharp from 'sharp'
import { rm } from 'node:fs/promises'

/**
 * PWA icons from the game's emblem (docs/design/icon-source.png: the crimson moon-blade, 1254 × 1254
 * on its night background). Run with `npm run icons` after changing the source.
 */
const source = new URL('../../docs/design/icon-source.png', import.meta.url).pathname
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname
const NIGHT = '#040733'

// The sword fills most of the square: crop the empty border so it reads at small sizes.
const tight = () => sharp(source).extract({ left: 177, top: 120, width: 900, height: 900 })

await tight().resize(192, 192).png().toFile(out('pwa-192x192.png'))
await tight().resize(512, 512).png().toFile(out('pwa-512x512.png'))
await tight().resize(180, 180).png().toFile(out('apple-touch-icon-180x180.png'))
await tight().resize(48, 48).png().toFile(out('favicon.png'))

// Maskable: the whole emblem inside the 80 % safe zone, on the same night color.
const inner = await tight().resize(400, 400).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: NIGHT } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile(out('maskable-icon-512x512.png'))

await rm(out('favicon.svg'), { force: true })
console.log('Íconos generados en public/')
