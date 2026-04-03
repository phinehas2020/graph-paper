import dedent from 'dedent';
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from '../base';
const PlanPoint = z.tuple([z.number(), z.number()]);
const PlanPath = z.array(PlanPoint);
export const BlockingKind = z.enum(['solid', 'bridging']);
export const FloorFramingKind = z.enum(['dimensional-lumber', 'i-joist', 'floor-truss']);
export const RimMode = z.enum(['rim-board', 'solid-blocking', 'open-web']);
export const FloorOpeningNode = BaseNode.extend({
    id: objectId('fopen'),
    type: nodeType('floor-opening'),
    polygon: PlanPath.default([]),
    curbHeight: z.number().default(0),
}).describe(dedent `
  Floor opening node - authored hole/cutout in a floor framing system.
  - polygon: opening boundary in level plan coordinates
  - curbHeight: optional upstand height in meters
  `);
export const BlockingRunNode = BaseNode.extend({
    id: objectId('block'),
    type: nodeType('blocking-run'),
    start: PlanPoint,
    end: PlanPoint,
    kind: BlockingKind.default('solid'),
    spacing: z.number().default(1.2192),
    materialCode: z.string().default('lumber.spf.2x10'),
}).describe(dedent `
  Blocking run node - authored blocking or bridging line for a floor framing system.
  - start/end: run endpoints in level plan coordinates
  - kind: solid blocking or bridging
  - spacing: spacing between repeated members when applicable
  `);
export const FloorSystemNode = BaseNode.extend({
    id: objectId('floor'),
    type: nodeType('floor-system'),
    children: z.array(z.union([FloorOpeningNode.shape.id, BlockingRunNode.shape.id])).default([]),
    polygon: PlanPath.default([]),
    derivedFromSlabId: z.string().nullable().default(null),
    framingKind: FloorFramingKind.default('dimensional-lumber'),
    joistAngle: z.number().default(0),
    joistSpacing: z.number().default(0.4064),
    memberDepth: z.number().default(0.2413),
    rimMode: RimMode.default('rim-board'),
    elevation: z.number().default(0.25),
    sheathingThickness: z.number().default(0.01905),
    assemblyId: z.string().optional(),
}).describe(dedent `
  Floor system node - authored residential floor framing intent.
  - polygon: floor framing boundary in level plan coordinates
  - framingKind: dimensional lumber, I-joist, or floor truss
  - joistAngle: member direction angle in radians in plan space
  - joistSpacing: framing spacing in meters
  - memberDepth: joist/truss depth in meters
  - rimMode: perimeter rim condition
  - elevation: vertical depth of the framing zone below the level datum
  - sheathingThickness: subfloor thickness in meters
  `);
export const BeamLineNode = BaseNode.extend({
    id: objectId('beam'),
    type: nodeType('beam-line'),
    start: PlanPoint,
    end: PlanPoint,
    width: z.number().default(0.0889),
    depth: z.number().default(0.2921),
    supportFloorSystemId: z.string().nullable().default(null),
    materialCode: z.string().default('lumber.spf.2x10'),
}).describe(dedent `
  Beam line node - authored beam supporting a floor system.
  - start/end: beam endpoints in level plan coordinates
  - width/depth: beam section dimensions in meters
  - supportFloorSystemId: optional associated floor framing system
  `);
export const SupportPostNode = BaseNode.extend({
    id: objectId('post'),
    type: nodeType('support-post'),
    center: PlanPoint,
    width: z.number().default(0.0889),
    depth: z.number().default(0.0889),
    height: z.number().default(2.4384),
    materialCode: z.string().default('lumber.spf.2x4'),
}).describe(dedent `
  Support post node - authored point support for floor and beam framing.
  - center: post center in level plan coordinates
  - width/depth/height: post dimensions in meters
  `);
