import type { IdentifyResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export async function identifyVehicle(file: File): Promise<IdentifyResponse> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE}/api/identify`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }))
    throw new Error(body.error?.message ?? 'Vehicle identification failed')
  }

  return response.json()
}
