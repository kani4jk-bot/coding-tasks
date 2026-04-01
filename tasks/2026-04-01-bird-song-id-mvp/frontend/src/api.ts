import type { IdentifyResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export async function identifyBird(file: File): Promise<IdentifyResponse> {
  const formData = new FormData()
  formData.append('audio', file)

  const response = await fetch(`${API_BASE}/api/identify`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown API error' }))
    throw new Error(error.detail ?? 'Bird identification failed')
  }

  return response.json()
}
