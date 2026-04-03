import dedent from 'dedent'
import { z } from 'zod'
import { BaseNode, nodeType, objectId } from '../base'

const Vec3 = z.tuple([z.number(), z.number(), z.number()])

export const PlumbingFixtureKind = z.enum([
  'sink',
  'toilet',
  'shower',
  'tub',
  'lavatory',
  'washer',
  'water-heater',
])
export const PlumbingSystemKind = z.enum(['hot', 'cold', 'drain', 'vent'])

export const PlumbingFixtureNode = BaseNode.extend({
  id: objectId('pfixture'),
  type: nodeType('plumbing-fixture'),
  position: Vec3.default([0, 0, 0]),
  fixtureType: PlumbingFixtureKind.default('sink'),
  roomType: z.string().default('bathroom'),
  pipeMaterial: z.string().default('PEX'),
  drainDiameter: z.number().default(0.0508),
}).describe(
  dedent`
  Plumbing fixture node - authored plumbing terminal fixture.
  - position: fixture position in level space
  - fixtureType: family used for defaults and schedules
  - roomType: optional room hint for wet-wall heuristics
  `,
)

export const SupplyRunNode = BaseNode.extend({
  id: objectId('supply'),
  type: nodeType('supply-run'),
  path: z.array(Vec3).default([]),
  systemKind: z.enum(['hot', 'cold']).default('cold'),
  pipeMaterial: z.string().default('PEX'),
  diameter: z.number().default(0.01905),
}).describe(
  dedent`
  Supply run node - authored plumbing supply path.
  - path: ordered run points in level space
  - systemKind: hot or cold supply
  - diameter: nominal inside diameter in meters
  `,
)

export const DrainRunNode = BaseNode.extend({
  id: objectId('drain'),
  type: nodeType('drain-run'),
  path: z.array(Vec3).default([]),
  pipeMaterial: z.string().default('PVC'),
  diameter: z.number().default(0.0762),
  slope: z.number().default(0.02),
}).describe(
  dedent`
  Drain run node - authored DWV drain path.
  - path: ordered run points in level space
  - diameter: nominal pipe diameter in meters
  - slope: slope ratio expressed as rise/run
  `,
)

export const VentRunNode = BaseNode.extend({
  id: objectId('vent'),
  type: nodeType('vent-run'),
  path: z.array(Vec3).default([]),
  pipeMaterial: z.string().default('PVC'),
  diameter: z.number().default(0.0508),
}).describe(
  dedent`
  Vent run node - authored plumbing vent path.
  - path: ordered vent points in level space
  - diameter: nominal pipe diameter in meters
  `,
)

export type PlumbingFixtureKind = z.infer<typeof PlumbingFixtureKind>
export type PlumbingSystemKind = z.infer<typeof PlumbingSystemKind>
export type PlumbingFixtureNode = z.infer<typeof PlumbingFixtureNode>
export type SupplyRunNode = z.infer<typeof SupplyRunNode>
export type DrainRunNode = z.infer<typeof DrainRunNode>
export type VentRunNode = z.infer<typeof VentRunNode>
