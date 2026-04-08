const TARGET_REGION_AREA_KM2 = 3
const REGION_SIDE_METERS = Math.sqrt(TARGET_REGION_AREA_KM2) * 1000
const METERS_PER_DEGREE_LATITUDE = 111_320
const MIN_LONGITUDE_SCALE = 0.2

export type ApproximateLocation = {
  latitude: number
  longitude: number
  regionAreaKm2: number
  regionSideMeters: number
}

function clampLongitudeScale(value: number) {
  return Math.max(Math.abs(value), MIN_LONGITUDE_SCALE)
}

export function approximateLocationToRegion(latitude: number, longitude: number): ApproximateLocation {
  const longitudeScale = clampLongitudeScale(Math.cos((latitude * Math.PI) / 180))
  const latitudeStep = REGION_SIDE_METERS / METERS_PER_DEGREE_LATITUDE
  const longitudeStep = REGION_SIDE_METERS / (METERS_PER_DEGREE_LATITUDE * longitudeScale)

  const snappedLatitude = (Math.floor(latitude / latitudeStep) + 0.5) * latitudeStep
  const snappedLongitude = (Math.floor(longitude / longitudeStep) + 0.5) * longitudeStep

  return {
    latitude: Math.max(-90, Math.min(90, snappedLatitude)),
    longitude: ((snappedLongitude + 540) % 360) - 180,
    regionAreaKm2: TARGET_REGION_AREA_KM2,
    regionSideMeters: REGION_SIDE_METERS,
  }
}

export function formatApproximateLocationPreview(latitude?: number, longitude?: number) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return 'No approximate region attached yet'
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)} · ~${TARGET_REGION_AREA_KM2} km² region`
}

export function getApproximateLocationRegionLabel() {
  return `~${TARGET_REGION_AREA_KM2} km² region`
}
