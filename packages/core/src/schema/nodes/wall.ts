import dedent from 'dedent'
import { z } from 'zod'
import { BaseNode, generateId, nodeType, objectId } from '../base'
import { ItemNode } from './item'
// import { DoorNode } from "./door";
// import { ItemNode } from "./item";
// import { WindowNode } from "./window";

export const DEFAULT_WALL_HEIGHT = 2.5

export const WallGuideReference = z.enum(['bottom', 'top'])

export const WallGuide = z.object({
  id: z.string().default(() => generateId('wguide')),
  offset: z.number().min(0),
  reference: WallGuideReference.default('bottom'),
  color: z.string().optional(),
})

export const WallNode = BaseNode.extend({
  id: objectId('wall'),
  type: nodeType('wall'),
  children: z.array(ItemNode.shape.id).default([]),
  // Specific props
  thickness: z.number().optional(),
  height: z.number().optional(),
  // e.g., start/end points for path
  start: z.tuple([z.number(), z.number()]),
  end: z.tuple([z.number(), z.number()]),
  // Space detection for cutaway mode
  frontSide: z.enum(['interior', 'exterior', 'unknown']).default('unknown'),
  backSide: z.enum(['interior', 'exterior', 'unknown']).default('unknown'),
  guides: z.array(WallGuide).default([]),
}).describe(
  dedent`
  Wall node - used to represent a wall in the building
  - thickness: thickness in meters
  - height: height in meters
  - start: start point of the wall in level coordinate system
  - end: end point of the wall in level coordinate system
  - size: size of the wall in grid units
  - frontSide: whether the front side faces interior, exterior, or unknown
  - backSide: whether the back side faces interior, exterior, or unknown
  - guides: persistent reference lines measured from the wall bottom or top
  `,
)
export type WallNode = z.infer<typeof WallNode>
export type WallGuide = z.infer<typeof WallGuide>
export type WallGuideReference = z.infer<typeof WallGuideReference>

export const getWallHeight = (wall: Pick<WallNode, 'height'>): number =>
  wall.height ?? DEFAULT_WALL_HEIGHT

export const getWallLength = (wall: Pick<WallNode, 'start' | 'end'>): number => {
  const dx = wall.end[0] - wall.start[0]
  const dz = wall.end[1] - wall.start[1]
  return Math.sqrt(dx * dx + dz * dz)
}

export const getWallGuideLocalY = (
  wall: Pick<WallNode, 'height'>,
  guide: Pick<WallGuide, 'offset' | 'reference'>,
): number => {
  const wallHeight = getWallHeight(wall)
  const rawValue = guide.reference === 'bottom' ? guide.offset : wallHeight - guide.offset
  return Math.min(wallHeight, Math.max(0, rawValue))
}
