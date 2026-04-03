import dedent from 'dedent'
import { z } from 'zod'
import { BaseNode, nodeType, objectId } from '../base'
import {
  ConstructionManualOverridesSchema,
  FloorJoistSystem,
  FloorMemberStock,
  FloorSupportLineSchema,
  FloorFramingStrategy,
  JoistDirection,
} from '../construction'
import { MaterialSchema } from '../material'

export const SlabNode = BaseNode.extend({
  id: objectId('slab'),
  type: nodeType('slab'),
  material: MaterialSchema.optional(),
  polygon: z.array(z.tuple([z.number(), z.number()])),
  holes: z.array(z.array(z.tuple([z.number(), z.number()]))).default([]),
  elevation: z.number().default(0.05), // Elevation in meters
  assemblyId: z.string().optional(),
  framingStrategy: FloorFramingStrategy.default('slab-on-grade'),
  joistDirection: JoistDirection.default('auto'),
  joistSystem: FloorJoistSystem.default('dimensional-lumber'),
  joistSpacing: z.number().default(0.4064),
  joistStock: FloorMemberStock.default('2x10'),
  beamStock: FloorMemberStock.default('2x10'),
  stockLength: z.number().default(4.8768),
  supportLines: z.array(FloorSupportLineSchema).default([]),
  manualOverrides: ConstructionManualOverridesSchema,
}).describe(
  dedent`
  Slab node - used to represent a slab/floor in the building
  - polygon: array of [x, z] points defining the slab boundary
  - elevation: elevation in meters
  - framingStrategy / joist settings: authored floor-system controls for regeneration
  `,
)

export type SlabNode = z.infer<typeof SlabNode>
