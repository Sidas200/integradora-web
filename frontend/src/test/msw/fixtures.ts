import type { components } from '@/shared/api/schema'

type NewsSummary = components['schemas']['NewsSummary']
type NewsPost = components['schemas']['NewsPost']
type Achievement = components['schemas']['Achievement']
type Account = components['schemas']['Account']
type TokenResponse = components['schemas']['TokenResponse']
type Settings = components['schemas']['Settings']
type Device = components['schemas']['Device']

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

export const settingsFixture: Settings = {
  musicVolume: 80,
  sfxVolume: 60,
  language: 'es',
  fullscreen: true,
  controls: { attack: '<Mouse>/leftButton', dash: '<Keyboard>/space' },
  updatedAt: '2026-10-20T18:00:00Z',
}

/** The browser making the request plus the game on the PC. */
export const devicesFixture: Device[] = [
  { id: '0a1b2c3d-0000-4000-8000-000000000001', client: 'WEB', description: 'Chrome · Windows', createdAt: '2026-10-22T18:00:00Z', lastUsedAt: '2026-10-22T19:00:00Z', current: true },
  { id: '0a1b2c3d-0000-4000-8000-000000000002', client: 'UNITY_PC', description: 'Juego · PC', createdAt: '2026-10-21T18:00:00Z', lastUsedAt: '2026-10-21T20:00:00Z', current: false },
]

// ------------------------------------------------------------------ player data (phase 3)

type SaveSummary = components['schemas']['SaveSummary']
type SaveDetail = components['schemas']['SaveDetail']
type PlaySession = components['schemas']['PlaySession']
type HistoryItem = components['schemas']['HistoryItem']
type PlayerAchievement = components['schemas']['PlayerAchievement']

/** Two slots used (1 and 2) and slot 3 empty, like accountFixture.summary.saves. Times at 18:00 UTC: same day in Mexico. */
export const savesFixture: SaveSummary[] = [
  { slot: 1, activeCharacter: 'TSUKI', currentChapter: 1, lastMilestone: { id: 'zone1_shrine', title: 'Primer santuario' }, milestonesCompleted: 3, milestonesTotal: 4, playTimeSec: 6720, updatedAt: '2026-10-20T18:00:00Z', version: 8 },
  { slot: 2, activeCharacter: 'HIKARI', currentChapter: 0, lastMilestone: null, milestonesCompleted: 0, milestonesTotal: 4, playTimeSec: 1500, updatedAt: '2026-10-05T18:00:00Z', version: 2 },
]

const milestonesCatalog = [
  { id: 'wake_up', title: 'Despertar en la isla', chapter: 0 },
  { id: 'meet_researcher', title: 'La investigadora', chapter: 1 },
  { id: 'zone1_shrine', title: 'Primer santuario', chapter: 1 },
  { id: 'zone1_guardian', title: 'El guardián de la zona', chapter: 1 },
]

/** GET /account/saves/{slot} of each used slot. */
export const saveDetailFixtures: Record<number, SaveDetail> = {
  1: {
    ...savesFixture[0],
    stats: { playTimeSec: 6720, enemiesDefeated: 148, deaths: 4, materialsCollected: 37, itemsCrafted: 9 },
    inventory: [
      { itemId: 'crimson_ore', name: 'Mineral carmesí', type: 'MATERIAL', rarity: 'RARE', iconKey: null, quantity: 5 },
      { itemId: 'sword_upgrade_1', name: 'Filo templado', type: 'UPGRADE', rarity: 'EPIC', iconKey: 'upgrade_sword', quantity: 1 },
    ],
    milestones: milestonesCatalog.map((m, i) => ({ ...m, completedAt: i < 3 ? `2026-10-${String(10 + i).padStart(2, '0')}T18:00:00Z` : null })),
  },
  2: {
    ...savesFixture[1],
    stats: { playTimeSec: 1500, enemiesDefeated: 6, deaths: 0, materialsCollected: 2, itemsCrafted: 0 },
    inventory: [],
    milestones: milestonesCatalog.map((m) => ({ ...m, completedAt: null })),
  },
}

/** 12 sessions in slot 1 (the newest still open) and 2 in slot 2, newest first like the API. */
export const sessionFixtures: PlaySession[] = [
  ...Array.from({ length: 12 }, (_, i): PlaySession => ({
    id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
    slot: 1,
    startedAt: new Date(Date.UTC(2026, 9, 20 - i, 18)).toISOString(),
    endedAt: i === 0 ? null : new Date(Date.UTC(2026, 9, 20 - i, 18, 30)).toISOString(),
    durationSec: i === 0 ? null : 1680,
    platform: 'WINDOWS',
  })),
  ...Array.from({ length: 2 }, (_, i): PlaySession => ({
    id: `00000000-0000-4000-8000-0000000002${String(i).padStart(2, '0')}`,
    slot: 2,
    startedAt: new Date(Date.UTC(2026, 9, 5 - i, 18)).toISOString(),
    endedAt: new Date(Date.UTC(2026, 9, 5 - i, 18, 25)).toISOString(),
    durationSec: 1500,
    platform: 'LINUX',
  })),
]

/** 23 entries (one more page than the 20 of the first one), cycling SESSION → ACHIEVEMENT → MILESTONE. */
export const historyFixtures: HistoryItem[] = Array.from({ length: 23 }, (_, i): HistoryItem => {
  const occurredAt = new Date(Date.UTC(2026, 9, 25 - i, 18)).toISOString()
  switch (i % 3) {
    case 0:
      return { type: 'SESSION', referenceId: `00000000-0000-4000-8000-0000000003${String(i).padStart(2, '0')}`, occurredAt, slot: 1, title: null, valueSec: 1680 }
    case 1:
      return { type: 'ACHIEVEMENT', referenceId: `achievement_${i}`, occurredAt, slot: null, title: `Logro ${i}`, valueSec: null }
    default:
      return { type: 'MILESTONE', referenceId: `milestone_${i}`, occurredAt, slot: 1, title: `Hito ${i}`, valueSec: 5400 }
  }
})

/** The full catalog with this player's status: 2 of 6 unlocked, like accountFixture.summary. */
export const myAchievementFixtures: PlayerAchievement[] = [
  { id: 'first_material', name: 'Primeros pasos', description: 'Recolecta tu primer material.', iconKey: 'achievement_material', hidden: false, sortOrder: 10, unlocked: true, unlockedAt: '2026-10-10T18:00:00Z' },
  { id: 'first_craft', name: 'El poder se fabrica', description: 'Fabrica tu primer objeto en la forja.', iconKey: 'achievement_forge', hidden: false, sortOrder: 20, unlocked: true, unlockedAt: '2026-10-12T18:00:00Z' },
  { id: 'first_guardian', name: 'Permiso concedido', description: 'Vence al guardián de la primera zona.', iconKey: null, hidden: false, sortOrder: 30, unlocked: false, unlockedAt: null },
  { id: 'no_damage', name: 'Intocable', description: 'Vence a un guardián sin recibir daño.', iconKey: null, hidden: false, sortOrder: 40, unlocked: false, unlockedAt: null },
  { id: 'rulebreaker', name: 'Logro oculto', description: null, iconKey: null, hidden: true, sortOrder: 50, unlocked: false, unlockedAt: null },
  { id: 'collector', name: 'Coleccionista', description: 'Recolecta 100 materiales.', iconKey: null, hidden: false, sortOrder: 60, unlocked: false, unlockedAt: null },
]