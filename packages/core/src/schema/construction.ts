import { z } from 'zod'
import { objectId } from './base'

export const ConstructionManualOverridesSchema = z.record(z.string(), z.json()).default({})

export const WallFramingStrategy = z.enum(['stud', 'service-wall', 'engineered'])
export const LevelFramingStrategy = z.enum(['platform', 'balloon', 'engineered'])
export const FloorFramingStrategy = z.enum(['slab-on-grade', 'joists', 'engineered'])
export const RoofFramingStrategy = z.enum(['rafters', 'trusses', 'engineered'])
export const JoistDirection = z.enum(['x', 'z', 'auto'])
export const FloorJoistSystem = z.enum(['dimensional-lumber', 'i-joist', 'open-web'])
export const FloorMemberStock = z.enum(['2x8', '2x10'])
export const FloorSupportLineAxis = z.enum(['x', 'z'])
export const FloorSupportLineKind = z.enum(['beam', 'bearing-line'])
export const FloorSupportLineSchema = z.object({
  id: objectId('floor_support'),
  axis: FloorSupportLineAxis.default('z'),
  kind: FloorSupportLineKind.default('beam'),
  offset: z.number().default(0),
  stock: FloorMemberStock.default('2x10'),
})
export const FixtureProfile = z.enum(['none', 'kitchen', 'bathroom', 'laundry', 'mechanical'])
export const RoomType = z.enum([
  'generic',
  'bedroom',
  'bathroom',
  'kitchen',
  'living',
  'dining',
  'office',
  'utility',
  'garage',
  'circulation',
])

export type WallFramingStrategy = z.infer<typeof WallFramingStrategy>
export type LevelFramingStrategy = z.infer<typeof LevelFramingStrategy>
export type FloorFramingStrategy = z.infer<typeof FloorFramingStrategy>
export type RoofFramingStrategy = z.infer<typeof RoofFramingStrategy>
export type JoistDirection = z.infer<typeof JoistDirection>
export type FloorJoistSystem = z.infer<typeof FloorJoistSystem>
export type FloorMemberStock = z.infer<typeof FloorMemberStock>
export type FloorSupportLineAxis = z.infer<typeof FloorSupportLineAxis>
export type FloorSupportLineKind = z.infer<typeof FloorSupportLineKind>
export type FloorSupportLine = z.infer<typeof FloorSupportLineSchema>
export type FixtureProfile = z.infer<typeof FixtureProfile>
export type RoomType = z.infer<typeof RoomType>
