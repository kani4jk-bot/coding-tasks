export type VehiclePrediction = {
  vehicle_type: string
  make: string | null
  model: string | null
  year_range: string | null
  country_of_origin: string | null
  confidence: number
  reason: string
  fun_facts: string[]
  specs: Record<string, string>
  brief_history: string | null
}

export type IdentifyResponse = {
  request_id: string
  received_at: string
  provider: string
  summary: {
    headline: string
    confidence_band: 'high' | 'medium' | 'low'
    short_description: string
    needs_more_context: boolean
  }
  top_match: VehiclePrediction
  alternatives: VehiclePrediction[]
  image: {
    filename: string
    content_type: string | null
    file_size_bytes: number
  }
}

export type SavedIdentification = {
  id: string
  result: IdentifyResponse
  savedAt: string
  notes?: string
  starred: boolean
}

export type RootStackParamList = {
  MainTabs: undefined
  Result: { result: IdentifyResponse }
}

export type MainTabParamList = {
  Capture: undefined
  History: undefined
  Settings: undefined
}

export type CameraPermissionState = 'undetermined' | 'granted' | 'denied'
