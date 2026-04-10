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

export type ResultSummary = {
  headline: string
  confidence_band: 'high' | 'medium' | 'low'
  short_description: string
  needs_more_context: boolean
}

export type IdentifyResponse = {
  request_id: string
  received_at: string
  provider: string
  summary: ResultSummary
  top_match: VehiclePrediction
  alternatives: VehiclePrediction[]
  image: {
    filename: string
    content_type: string | null
    file_size_bytes: number
  }
}
