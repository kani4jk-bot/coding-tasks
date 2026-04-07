export type SpeciesPrediction = {
  species_code: string
  common_name: string
  scientific_name: string
  confidence: number
  reason: string
}

export type IdentifyResponse = {
  request_id: string
  received_at: string
  provider: string
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

export type RootStackParamList = {
  MainTabs: undefined
  Result: { result: IdentifyResponse }
}

export type MainTabParamList = {
  Listen: undefined
  History: undefined
  Settings: undefined
}
