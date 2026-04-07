import type { IdentifyResponse } from '../types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000'

export async function identifyBirdClip(file: {
  uri: string
  name: string
  mimeType?: string
}): Promise<IdentifyResponse> {
  const formData = new FormData()
  formData.append('audio', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'audio/m4a',
  } as unknown as Blob)

  const response = await fetch(`${API_BASE}/api/identify`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown API error' }))
    throw new Error(error.detail ?? 'Bird identification failed')
  }

  return response.json()
}
