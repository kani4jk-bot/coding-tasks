import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IdentifyResponse, SavedIdentification } from '../types'

const HISTORY_KEY = '@vehicle_id/history'

async function loadAll(): Promise<SavedIdentification[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY)
  return raw ? (JSON.parse(raw) as SavedIdentification[]) : []
}

async function saveAll(items: SavedIdentification[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

export async function upsertIdentification(
  result: IdentifyResponse,
  overrides: Partial<Pick<SavedIdentification, 'starred' | 'notes'>> = {},
): Promise<SavedIdentification> {
  const all = await loadAll()
  const existing = all.find((s) => s.id === result.request_id)

  const next: SavedIdentification = {
    id: result.request_id,
    result,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
    notes: overrides.notes ?? existing?.notes ?? '',
    starred: overrides.starred ?? existing?.starred ?? false,
  }

  const updated = existing ? all.map((s) => (s.id === next.id ? next : s)) : [next, ...all]
  await saveAll(updated)
  return next
}

export async function getSavedIdentification(requestId: string): Promise<SavedIdentification | null> {
  const all = await loadAll()
  return all.find((s) => s.id === requestId) ?? null
}

export async function getAllIdentifications(): Promise<SavedIdentification[]> {
  return loadAll()
}

export async function toggleStar(id: string): Promise<SavedIdentification | null> {
  const all = await loadAll()
  const item = all.find((s) => s.id === id)
  if (!item) return null
  const updated = { ...item, starred: !item.starred }
  await saveAll(all.map((s) => (s.id === id ? updated : s)))
  return updated
}

export async function saveNotes(id: string, notes: string): Promise<void> {
  const all = await loadAll()
  await saveAll(all.map((s) => (s.id === id ? { ...s, notes } : s)))
}

export async function removeIdentification(id: string): Promise<void> {
  const all = await loadAll()
  await saveAll(all.filter((s) => s.id !== id))
}
