import type { IdentifyResponse } from '../types'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE ?? 'https://plant-id-backend-production.up.railway.app'

export async function identifyPlant(
  uri: string,
  filename: string,
  mimeType: string,
): Promise<IdentifyResponse> {
  const body = new FormData()
  body.append('image', { uri, name: filename, type: mimeType } as unknown as Blob)

  const res = await fetch(`${BASE_URL}/api/identify`, {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}
