import type { components } from '@/shared/api/schema'

type NewsSummary = components['schemas']['NewsSummary']
type NewsPost = components['schemas']['NewsPost']
type Achievement = components['schemas']['Achievement']

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