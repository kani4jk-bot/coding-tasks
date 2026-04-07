import type { IdentifyResponse } from '../types'

export const mockResult: IdentifyResponse = {
  request_id: 'birdreq_demo123456',
  received_at: '2026-04-01T00:00:00Z',
  provider: 'mock',
  top_match: {
    species_code: 'annhumming',
    common_name: "Anna's Hummingbird",
    scientific_name: 'Calypte anna',
    confidence: 0.82,
    reason: 'Repeated high-energy chirps and trills matched the local demo profile.',
  },
  alternatives: [
    {
      species_code: 'bewwren',
      common_name: 'Bewick\'s Wren',
      scientific_name: 'Thryomanes bewickii',
      confidence: 0.56,
      reason: 'Possible fast phrase pattern, but weaker than the top match.',
    },
    {
      species_code: 'houfin',
      common_name: 'House Finch',
      scientific_name: 'Haemorhous mexicanus',
      confidence: 0.41,
      reason: 'Some pitch contour overlap in the sample shell result.',
    },
  ],
  advice: ['Get closer to the loudest bird and keep the clip under 15 seconds.'],
  clip: {
    filename: 'field-demo.m4a',
    content_type: 'audio/m4a',
    file_size_bytes: 1874000,
    latitude: 37.54,
    longitude: -122.29,
    recorded_on: '2026-04-01',
  },
}
