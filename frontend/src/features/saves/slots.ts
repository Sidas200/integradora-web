/** The game has three save slots (CHECK in the database and minimum/maximum in the contract). */
export const SLOTS = [1, 2, 3] as const

/** ":slot" of the URL → 1, 2 or 3; anything else is null and the page answers "not found" without calling the API. */
export function parseSlot(value: string | undefined): number | null {
  return value !== undefined && /^[1-3]$/.test(value) ? Number(value) : null
}

/** The most recently saved slot, for the dashboard. */
export function latestSave<T extends { updatedAt: string }>(saves: readonly T[]): T | undefined {
  return saves.reduce<T | undefined>(
    (latest, save) => (!latest || Date.parse(save.updatedAt) > Date.parse(latest.updatedAt) ? save : latest),
    undefined,
  )
}