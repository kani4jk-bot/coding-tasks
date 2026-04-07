import AsyncStorage from '@react-native-async-storage/async-storage'

import type { IdentifyResponse, SavedSighting } from '../types'

const STORAGE_KEY = 'birdsong-id/history/v1'

async function readHistory(): Promise<SavedSighting[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as SavedSighting[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeHistory(items: SavedSighting[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export async function listSightings(): Promise<SavedSighting[]> {
  const items = await readHistory()
  return items.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
}

export async function upsertSighting(result: IdentifyResponse, options?: { starred?: boolean; notes?: string }) {
  const items = await readHistory()
  const existing = items.find((item) => item.result.request_id === result.request_id)

  if (existing) {
    existing.result = result
    existing.starred = options?.starred ?? existing.starred
    existing.notes = options?.notes ?? existing.notes
    await writeHistory(items)
    return existing
  }

  const created: SavedSighting = {
    id: result.request_id,
    result,
    savedAt: new Date().toISOString(),
    notes: options?.notes,
    starred: options?.starred ?? false,
  }

  await writeHistory([created, ...items].slice(0, 100))
  return created
}

export async function removeSighting(id: string) {
  const items = await readHistory()
  await writeHistory(items.filter((item) => item.id !== id))
}

export async function clearSightings() {
  await writeHistory([])
}

export async function toggleStar(id: string) {
  const items = await readHistory()
  const updated = items.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
  await writeHistory(updated)
  return updated.find((item) => item.id === id) ?? null
}

export async function saveSightingNotes(id: string, notes: string) {
  const items = await readHistory()
  const trimmed = notes.trim()
  const updated = items.map((item) => (item.id === id ? { ...item, notes: trimmed || undefined } : item))
  await writeHistory(updated)
  return updated.find((item) => item.id === id) ?? null
}

export async function getSavedSighting(id: string) {
  const items = await readHistory()
  return items.find((item) => item.id === id || item.result.request_id === id) ?? null
}

export async function getHistoryStats() {
  const items = await listSightings()
  const starred = items.filter((item) => item.starred).length
  const noted = items.filter((item) => Boolean(item.notes?.trim())).length
  const uniqueSpecies = new Set(items.map((item) => item.result.top_match.species_code)).size

  return {
    total: items.length,
    starred,
    noted,
    uniqueSpecies,
    latestSavedAt: items[0]?.savedAt ?? null,
  }
}
