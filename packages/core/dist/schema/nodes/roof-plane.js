import dedent from 'dedent';
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from '../base';
const PlanPoint = z.tuple([z.number(), z.number()]);
const PlanPath = z.array(PlanPoint);
export const RoofFramingMode = z.enum(['truss-array', 'rafter-set']);
export const TrussArrayNode = BaseNode.extend({
    id: objectId('truss'),
    type: nodeType('truss-array'),
    roofPlaneId: z.string().nullable().default(null),
    start: PlanPoint,
    end: PlanPoint,
    spacing: z.number().default(0.6096),
    heelHeight: z.number().default(0.3048),
    overhang: z.number().default(0.4572),
    assemblyId: z.string().optional(),
}).describe(dedent `
  Truss array node - authored truss framing intent for a roof plane.
  - start/end: baseline in roof plan coordinates
  - spacing: truss spacing in meters
  - heelHeight: heel/bearing height in meters
  - overhang: overhang length in meters
  `);
export const RafterSetNode = BaseNode.extend({
    id: objectId('rafter'),
    type: nodeType('rafter-set'),
    roofPlaneId: z.string().nullable().default(null),
    start: PlanPoint,
    end: PlanPoint,
    spacing: z.number().default(0.4064),
    ridgeBoardDepth: z.number().default(0.0381),
    overhang: z.number().default(0.4572),
    assemblyId: z.string().optional(),
}).describe(dedent `
  Rafter set node - authored rafter framing intent for a roof plane.
  - start/end: baseline in roof plan coordinates
  - spacing: rafter spacing in meters
  - ridgeBoardDepth: ridge board depth in meters
  - overhang: overhang length in meters
  `);
export const RoofPlaneNode = BaseNode.extend({
    id: objectId('rplane'),
    type: nodeType('roof-plane'),
    children: z.array(z.union([TrussArrayNode.shape.id, RafterSetNode.shape.id])).default([]),
    polygon: PlanPath.default([]),
    pitch: z.number().default(6),
    overhang: z.number().default(0.4572),
    plateHeight: z.number().default(2.7432),
    heelHeight: z.number().default(0.3048),
    sheathingThickness: z.number().default(0.015875),
    roofingThickness: z.number().default(0.0127),
    framingMode: RoofFramingMode.default('truss-array'),
    assemblyId: z.string().optional(),
}).describe(dedent `
  Roof plane node - authored roof surface intent.
  - polygon: roof footprint boundary in plan coordinates
  - pitch: rise per 12 units of run
  - overhang: eave overhang in meters
  - plateHeight: wall bearing elevation in meters
  - heelHeight: framing heel/bearing height in meters
  - framingMode: generated framing strategy
  `);
