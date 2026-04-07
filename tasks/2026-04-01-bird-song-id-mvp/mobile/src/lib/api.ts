import type { IdentifyResponse } from '../types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000'

type NativeClipFile = {
  uri: string
  name: string
  mimeType?: string
}

type ApiError = {
  request_id?: string
  error?: {
    code?: string
    message?: string
  }
  detail?: string
}

export async function identifyBirdClip(file: NativeClipFile): Promise<IdentifyResponse> {
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
    const error = (await response.json().catch(() => ({ detail: 'Unknown API error' }))) as ApiError
    const message = error.error?.message ?? error.detail ?? 'Bird identification failed'
    const code = error.error?.code ? ` (${error.error.code})` : ''
    throw new Error(`${message}${code}`)
  }

  return response.json()
}

export function getApiBase() {
  return API_BASE
}
