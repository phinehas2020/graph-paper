import { formatLengthImperial, parseLengthToMeters } from '../../../lib/units'

export const roundToGridHalf = (value: number): number => Math.round(value * 2) / 2

type Point2D = [number, number]

export const calculateDirectionLength = (
  start: Point2D,
  to: Point2D,
): { length: number; dx: number; dz: number } => {
  const dx = to[0] - start[0]
  const dz = to[1] - start[1]
  return {
    dx,
    dz,
    length: Math.sqrt(dx * dx + dz * dz),
  }
}

export const snapPointTo45Degrees = (start: Point2D, to: Point2D): Point2D => {
  const dx = to[0] - start[0]
  const dz = to[1] - start[1]

  const angle = Math.atan2(dz, dx)
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  const distance = Math.sqrt(dx * dx + dz * dz)

  return [
    roundToGridHalf(start[0] + Math.cos(snappedAngle) * distance),
    roundToGridHalf(start[1] + Math.sin(snappedAngle) * distance),
  ]
}

export const projectPointAlongDirection = (
  start: Point2D,
  to: Point2D,
  targetLength: number,
): Point2D | null => {
  const { dx, dz, length } = calculateDirectionLength(start, to)
  if (!Number.isFinite(targetLength) || targetLength <= 0 || length === 0) return null

  const scale = targetLength / length

  return [roundToGridHalf(start[0] + dx * scale), roundToGridHalf(start[1] + dz * scale)]
}

export const formatLength = (value: number): string =>
  Number.isFinite(value) ? formatLengthImperial(value) : ''

export const parseLengthInput = (value: string): number | null => {
  const parsed = parseLengthToMeters(value)
  if (!Number.isFinite(parsed) || parsed === null || parsed <= 0) return null
  return parsed
}
