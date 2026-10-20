import sharp from 'sharp'
import { readFile, copyFile } from 'node:fs/promises'

const svg = await readFile(new URL('../../docs/design/icon.svg', import.meta.url))
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname

await sharp(svg).resize(192, 192).png().toFile(out('pwa-192x192.png'))
await sharp(svg).resize(512, 512).png().toFile(out('pwa-512x512.png'))
const inner = await sharp(svg).resize(410, 410).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#F3F9FE' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile(out('maskable-icon-512x512.png'))
await sharp(svg).resize(180, 180).png().toFile(out('apple-touch-icon-180x180.png'))
await copyFile(new URL('../../docs/design/icon.svg', import.meta.url), out('favicon.svg'))
console.log('Íconos generados en public/')
