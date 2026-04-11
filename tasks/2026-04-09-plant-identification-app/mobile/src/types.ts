export interface GrowingTip {
  category: string
  tip: string
}

export interface PlantResult {
  common_name: string
  scientific_name: string
  confidence: 'high' | 'medium' | 'low'
  description: string
  fun_facts: string[]
  is_houseplant: boolean
  growing_tips: GrowingTip[]
}

export interface IdentifyResponse {
  request_id: string
  received_at: string
  provider: string
  result: PlantResult
  alternatives: PlantResult[]
  image: { filename: string; content_type: string | null; file_size_bytes: number }
}

export interface SavedIdentification {
  id: string
  result: IdentifyResponse
  savedAt: string
  starred: boolean
  notes: string
}

export type RootStackParamList = {
  MainTabs: undefined
  Result: { result: IdentifyResponse }
}

export type MainTabParamList = {
  Capture: undefined
  History: undefined
}
