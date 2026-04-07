import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'

import { identifyBirdClip } from './api'
import { upsertSighting } from './history'
import type { CaptureContext, QueueProcessResult, QueuedIdentification } from '../types'

const STORAGE_KEY = 'birdsong-id/retry-queue/v1'
const CLIP_DIR = `${FileSystem.documentDirectory ?? ''}queued-clips`

let processingPromise: Promise<QueueProcessResult> | null = null

async function ensureClipDir() {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document storage is not available on this device.')
  }

  const info = await FileSystem.getInfoAsync(CLIP_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CLIP_DIR, { intermediates: true })
  }
}

async function readQueue(): Promise<QueuedIdentification[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as QueuedIdentification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeQueue(items: QueuedIdentification[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80) || 'queued-recording.m4a'
}

export async function listQueuedIdentifications(): Promise<QueuedIdentification[]> {
  const items = await readQueue()
  return items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

export async function getRetryQueueStats() {
  const items = await listQueuedIdentifications()
  const pending = items.length
  const attempted = items.filter((item) => item.attempts > 0).length
  const newestQueuedAt = items.at(-1)?.createdAt ?? null

  return {
    pending,
    attempted,
    newestQueuedAt,
  }
}

export async function enqueueIdentification(params: {
  clipUri: string
  clipName: string
  mimeType?: string
  context?: CaptureContext
  lastError?: string
}) {
  await ensureClipDir()

  const id = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const extension = params.clipName.includes('.') ? params.clipName.split('.').pop() : 'm4a'
  const persistedName = `${id}-${sanitizeName(`clip.${extension ?? 'm4a'}`)}`
  const persistedUri = `${CLIP_DIR}/${persistedName}`

  await FileSystem.copyAsync({
    from: params.clipUri,
    to: persistedUri,
  })

  const now = new Date().toISOString()
  const item: QueuedIdentification = {
    id,
    createdAt: now,
    updatedAt: now,
    clipUri: persistedUri,
    clipName: params.clipName,
    mimeType: params.mimeType,
    context: params.context,
    attempts: 0,
    lastError: params.lastError,
  }

  const items = await readQueue()
  await writeQueue([...items, item])
  return item
}

export async function removeQueuedIdentification(id: string) {
  const items = await readQueue()
  const target = items.find((item) => item.id === id)
  await writeQueue(items.filter((item) => item.id !== id))

  if (target) {
    await FileSystem.deleteAsync(target.clipUri, { idempotent: true })
  }
}

export async function clearRetryQueue() {
  const items = await readQueue()
  await writeQueue([])
  await Promise.all(items.map((item) => FileSystem.deleteAsync(item.clipUri, { idempotent: true }).catch(() => undefined)))
}

async function markFailure(id: string, error: string) {
  const items = await readQueue()
  const now = new Date().toISOString()
  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          attempts: item.attempts + 1,
          updatedAt: now,
          lastTriedAt: now,
          lastError: error,
        }
      : item,
  )
  await writeQueue(updated)
}

async function processQueueInternal(limit = Number.POSITIVE_INFINITY): Promise<QueueProcessResult> {
  const items = await listQueuedIdentifications()
  let processed = 0
  let succeeded = 0
  let failed = 0
  let latestSuccess: QueueProcessResult['latestSuccess']

  for (const item of items) {
    if (processed >= limit) break
    processed += 1

    try {
      const result = await identifyBirdClip({
        uri: item.clipUri,
        name: item.clipName,
        mimeType: item.mimeType,
        context: item.context,
      })

      await upsertSighting(result)
      await removeQueuedIdentification(item.id)
      succeeded += 1
      latestSuccess = result
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : 'Retry failed'
      await markFailure(item.id, message)
    }
  }

  return { processed, succeeded, failed, latestSuccess }
}

export async function processRetryQueue(limit?: number): Promise<QueueProcessResult> {
  if (processingPromise) {
    return processingPromise
  }

  processingPromise = processQueueInternal(limit)
  try {
    return await processingPromise
  } finally {
    processingPromise = null
  }
}
