import type { IdentifyOptions, IdentifyResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export async function identifyBird(file: File, options: IdentifyOptions = {}): Promise<IdentifyResponse> {
  const formData = new FormData()
  formData.append('audio', file)

  if (typeof options.latitude === 'number' && Number.isFinite(options.latitude)) {
    formData.append('latitude', String(options.latitude))
  }

  if (typeof options.longitude === 'number' && Number.isFinite(options.longitude)) {
    formData.append('longitude', String(options.longitude))
  }

  if (options.recordedOn) {
    formData.append('recorded_on', options.recordedOn)
  }

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
