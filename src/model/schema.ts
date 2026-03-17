import { z } from 'zod';

// --- Primitives ---

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type PointZ = z.infer<typeof PointSchema>;

// --- Wall & Openings ---

export const WallOpeningSchema = z.object({
  id: z.string(),
  type: z.enum(['door', 'window']),
  offset: z.number().min(0).max(1),
  width: z.number().positive(),
  height: z.number().positive(),
  bottom: z.number().min(0),
  hingeSide: z.enum(['start', 'end']).optional(),
});

export type WallOpeningZ = z.infer<typeof WallOpeningSchema>;

export const WallSchema = z.object({
  id: z.string(),
  start: PointSchema,
  end: PointSchema,
  height: z.number().positive(),
  thickness: z.number().positive(),
  color: z.string().optional(),
  openings: z.array(WallOpeningSchema),
  connected: z.boolean().optional(),
  connections: z
    .object({
      start: z.array(z.string()).optional(),
      end: z.array(z.string()).optional(),
    })
    .optional(),
});

export type WallZ = z.infer<typeof WallSchema>;

// --- Floor ---

export const FloorSchema = z.object({
  id: z.string(),
  points: z.array(PointSchema).min(3),
  elevation: z.number(),
  thickness: z.number().positive(),
});

export type FloorZ = z.infer<typeof FloorSchema>;

// --- Ceiling ---

export const CeilingSchema = z.object({
  id: z.string(),
  points: z.array(PointSchema).min(3),
  elevation: z.number(),
  thickness: z.number().positive(),
  holes: z.array(z.array(PointSchema).min(3)),
});

export type CeilingZ = z.infer<typeof CeilingSchema>;

// --- Roof ---

export const RoofSchema = z.object({
  id: z.string(),
  start: PointSchema,
  end: PointSchema,
  height: z.number().positive(),
  overhang: z.number().min(0),
  ridgeHeight: z.number().positive(),
});

export type RoofZ = z.infer<typeof RoofSchema>;

// --- Zone ---

export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.array(PointSchema).min(3),
  color: z.string(),
  level: z.number().int(),
});

export type ZoneZ = z.infer<typeof ZoneSchema>;

// --- Measurement ---

export const MeasurementSchema = z.object({
  id: z.string(),
  p1: PointSchema,
  p2: PointSchema,
  label: z.string().optional(),
});

export type MeasurementZ = z.infer<typeof MeasurementSchema>;

// --- Text Element ---

export const TextElementSchema = z.object({
  id: z.string(),
  position: PointSchema,
  content: z.string(),
  fontSize: z.number().positive(),
});

export type TextElementZ = z.infer<typeof TextElementSchema>;

// --- Level ---

export const LevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int(),
  elevation: z.number(),
  height: z.number().positive(),
});

export type LevelZ = z.infer<typeof LevelSchema>;

// --- Building ---

export const BuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  levels: z.array(LevelSchema),
});

export type BuildingZ = z.infer<typeof BuildingSchema>;

// --- Site ---

export const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  buildings: z.array(BuildingSchema),
});

export type SiteZ = z.infer<typeof SiteSchema>;

// --- Discriminated Union ---

export const PlannerNodeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('wall'), data: WallSchema }),
  z.object({ type: z.literal('wallOpening'), data: WallOpeningSchema }),
  z.object({ type: z.literal('floor'), data: FloorSchema }),
  z.object({ type: z.literal('ceiling'), data: CeilingSchema }),
  z.object({ type: z.literal('roof'), data: RoofSchema }),
  z.object({ type: z.literal('zone'), data: ZoneSchema }),
  z.object({ type: z.literal('measurement'), data: MeasurementSchema }),
  z.object({ type: z.literal('textElement'), data: TextElementSchema }),
  z.object({ type: z.literal('level'), data: LevelSchema }),
  z.object({ type: z.literal('building'), data: BuildingSchema }),
  z.object({ type: z.literal('site'), data: SiteSchema }),
]);

export type PlannerNode = z.infer<typeof PlannerNodeSchema>;

export type PlannerNodeType = PlannerNode['type'];
