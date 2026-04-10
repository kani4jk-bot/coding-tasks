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
  result: PlantResult
}

export type RootStackParamList = {
  Capture: undefined
  Result: { result: IdentifyResponse }
}
