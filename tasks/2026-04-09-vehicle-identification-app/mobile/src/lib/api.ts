import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IdentifyResponse } from '../types'

const DEFAULT_BASE = 'https://vehicle-id-backend-production.up.railway.app'
const API_BASE_KEY = '@vehicle_id/api_base'

export async function getApiBase(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_BASE_KEY)
  return (stored ?? process.env.EXPO_PUBLIC_API_BASE ?? DEFAULT_BASE).replace(/\/$/, '')
}

export async function setApiBase(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_KEY, url.replace(/\/$/, ''))
}

export async function identifyVehicle(imageUri: string, filename: string, mimeType: string): Promise<IdentifyResponse> {
  const base = await getApiBase()

  const form = new FormData()
  form.append('image', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob)

  const response = await fetch(`${base}/api/identify`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body?.error?.message ?? `Server error ${response.status}`
    throw new Error(message)
  }

  return response.json() as Promise<IdentifyResponse>
}
