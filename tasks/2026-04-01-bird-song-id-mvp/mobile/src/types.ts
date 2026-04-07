export type BirdMetadata = {
  family?: string | null
  habitat: string[]
  diet: string[]
  behavior: string[]
  best_time_to_find?: string | null
  seasonal_status?: string | null
  conservation_status?: string | null
  look_for: string[]
}

export type SpeciesPrediction = {
  species_code: string
  common_name: string
  scientific_name: string
  confidence: number
  reason: string
  metadata?: BirdMetadata | null
}

export type IdentifyResponse = {
  request_id: string
  received_at: string
  provider: string
  summary: {
    headline: string
    confidence_band: 'high' | 'medium' | 'low'
    short_description: string
    likely_species_count: number
    needs_more_context: boolean
  }
  flags: {
    used_location_context: boolean
    used_date_context: boolean
    has_alternatives: boolean
    review_recommended: boolean
  }
  top_match: SpeciesPrediction
  alternatives: SpeciesPrediction[]
  advice: string[]
  clip: {
    filename: string
    content_type?: string | null
    file_size_bytes: number
    latitude?: number | null
    longitude?: number | null
    recorded_on?: string | null
  }
}

export type SavedSighting = {
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
  Listen: undefined
  History: undefined
  Settings: undefined
}

export type RecordingPermissionState = 'undetermined' | 'granted' | 'denied'
