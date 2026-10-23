import type { components } from '@/shared/api/schema'

type NewsSummary = components['schemas']['NewsSummary']
type NewsPost = components['schemas']['NewsPost']
type Achievement = components['schemas']['Achievement']
type Account = components['schemas']['Account']
type TokenResponse = components['schemas']['TokenResponse']

/** Example data shaped exactly like the contract (the compiler checks it against schema.d.ts). */
export const newsFixtures: NewsPost[] = Array.from({ length: 8 }, (_, i) => ({
  slug: `devlog-${String(i + 1).padStart(2, '0')}`,
  title: `Devlog #${i + 1}`,
  summary: `Resumen del devlog ${i + 1}.`,
  coverKey: null,
  publishedAt: new Date(Date.UTC(2026, 9, 20 - i, 18)).toISOString(),
  contentMd: `## Avance ${i + 1}\n\nTexto del devlog **${i + 1}**.`,
}))

export const toSummary = ({ contentMd: _contentMd, ...summary }: NewsPost): NewsSummary => summary

export const achievementFixtures: Achievement[] = [
  { id: 'first_material', name: 'Primeros pasos', description: 'Recolecta tu primer material.', iconKey: 'achievement_material', hidden: false, sortOrder: 10 },
  { id: 'rulebreaker', name: 'Logro oculto', description: null, iconKey: null, hidden: true, sortOrder: 50 },
]

export const accountFixture: Account = {
  id: '6f1c2a7e-0b7d-4e7a-9a0e-3d1f5b2c9e11',
  username: 'Felc',
  email: 'felc@example.com',
  createdAt: '2026-10-01T18:20:00Z',
  lastLoginAt: '2026-10-10T01:58:00Z',
  summary: { saves: 2, playTimeSec: 11520, enemiesDefeated: 148, itemsCrafted: 9, achievementsUnlocked: 2, achievementsTotal: 6, lastSessionAt: '2026-10-10T01:58:00Z' },
}

/** WEB answer of /auth/login, /register and /refresh: the refresh token travels only in the cookie. */
export const tokenFixture = (accessToken = 'access-1'): TokenResponse => ({
  accessToken,
  tokenType: 'Bearer',
  expiresInSec: 900,
  player: { id: accountFixture.id, username: accountFixture.username, email: accountFixture.email },
})