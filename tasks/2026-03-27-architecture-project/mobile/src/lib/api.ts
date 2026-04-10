import * as FileSystem from 'expo-file-system'
import type { Box, EditResult, Point } from '../types'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:5001'

async function uriToBase64DataUrl(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${base64}`
}

export async function editImage(params: {
  imageUri: string
  mode: 'point' | 'box'
  modification: string
  points?: Point[]
  box?: Box
}): Promise<EditResult> {
  const { imageUri, mode, modification, points, box } = params

  const imageBase64 = await uriToBase64DataUrl(imageUri)

  const body: Record<string, unknown> = { image: imageBase64, mode, modification }
  if (mode === 'point' && points) body.points = points
  if (mode === 'box' && box) body.box = box

  const res = await fetch(`${BASE_URL}/api/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json()
}
