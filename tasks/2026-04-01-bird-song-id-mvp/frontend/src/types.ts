export type SpeciesPrediction = {
  species_code: string
  common_name: string
  scientific_name: string
  confidence: number
  reason: string
}

export type IdentifyResponse = {
  provider: string
  top_match: SpeciesPrediction
  alternatives: SpeciesPrediction[]
  advice: string[]
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}
