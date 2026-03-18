const METERS_PER_INCH = 0.0254
const METERS_PER_FOOT = 0.3048
const SQUARE_FEET_PER_SQUARE_METER = 10.763910416709722

const areaFormatterCache = new Map<number, Intl.NumberFormat>()

const getAreaFormatter = (precision: number) => {
  let formatter = areaFormatterCache.get(precision)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })
    areaFormatterCache.set(precision, formatter)
  }
  return formatter
}

export const formatLengthImperial = (meters: number): string => {
  if (!Number.isFinite(meters)) return ''

  const sign = meters < 0 ? '-' : ''
  const totalInches = Math.round(Math.abs(meters) / METERS_PER_INCH)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12

  if (feet === 0) return `${sign}${inches}"`
  return `${sign}${feet}' ${inches}"`
}

export const formatAreaImperial = (squareMeters: number, precision = 1): string => {
  if (!Number.isFinite(squareMeters)) return ''

  const squareFeet = squareMeters * SQUARE_FEET_PER_SQUARE_METER
  return `${getAreaFormatter(precision).format(squareFeet)} sq ft`
}

export const formatDimensionTupleImperial = (dimensions: number[]): string =>
  dimensions.map((dimension) => formatLengthImperial(dimension)).join(' × ')

export const parseLengthToMeters = (value: string): number | null => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[′’]/g, "'")
    .replace(/[″”]/g, '"')
    .replace(/\bfeet\b|\bfoot\b/g, 'ft')
    .replace(/\binches\b|\binch\b/g, 'in')
    .replace(',', '.')
    .replace(/\s+/g, ' ')

  if (!normalized) return null

  const metricMatch = normalized.match(/^(-?\d+(?:\.\d+)?)\s*m$/)
  if (metricMatch) {
    const parsedMetric = Number(metricMatch[1])
    return Number.isFinite(parsedMetric) ? parsedMetric : null
  }

  const feetAndInchesMatch = normalized.match(
    /^(-?\d+(?:\.\d+)?)\s*(?:ft|')\s*(?:(\d+(?:\.\d+)?)\s*(?:in|")?)?$/,
  )
  if (feetAndInchesMatch) {
    const feetValue = Number(feetAndInchesMatch[1])
    const inchesValue = feetAndInchesMatch[2] ? Number(feetAndInchesMatch[2]) : 0

    if (!Number.isFinite(feetValue) || !Number.isFinite(inchesValue) || inchesValue < 0) {
      return null
    }

    const sign = feetValue < 0 ? -1 : 1
    const totalInches = Math.abs(feetValue) * 12 + inchesValue
    return sign * totalInches * METERS_PER_INCH
  }

  const inchesMatch = normalized.match(/^(-?\d+(?:\.\d+)?)\s*(?:in|")$/)
  if (inchesMatch) {
    const parsedInches = Number(inchesMatch[1])
    return Number.isFinite(parsedInches) ? parsedInches * METERS_PER_INCH : null
  }

  const feetMatch = normalized.match(/^(-?\d+(?:\.\d+)?)\s*(?:ft|')?$/)
  if (feetMatch) {
    const parsedFeet = Number(feetMatch[1])
    return Number.isFinite(parsedFeet) ? parsedFeet * METERS_PER_FOOT : null
  }

  return null
}
