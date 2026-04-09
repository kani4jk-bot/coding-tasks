export type GrowingTip = {
  category: string
  tip: string
}

export type PlantResult = {
  common_name: string
  scientific_name: string
  confidence: 'high' | 'medium' | 'low'
  description: string
  fun_facts: string[]
  is_houseplant: boolean
  growing_tips: GrowingTip[]
}

export type IdentifyResponse = {
  request_id: string
  received_at: string
  provider: string
  result: PlantResult
  image: {
    filename: string
    content_type: string | null
    file_size_bytes: number
  }
}
