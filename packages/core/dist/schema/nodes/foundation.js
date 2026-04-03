import dedent from 'dedent';
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from '../base';
const PlanPoint = z.tuple([z.number(), z.number()]);
export const FoundationKind = z.enum(['slab-on-grade', 'crawlspace', 'basement']);
export const FootingRunNode = BaseNode.extend({
    id: objectId('footing'),
    type: nodeType('footing-run'),
    start: PlanPoint,
    end: PlanPoint,
    width: z.number().default(0.6096),
    depth: z.number().default(0.3048),
    thickness: z.number().default(0.2032),
}).describe(dedent `
  Footing run node - authored continuous footing segment.
  - start/end: footing endpoints in plan coordinates
  - width/depth/thickness: footing dimensions in meters
  `);
export const StemWallNode = BaseNode.extend({
    id: objectId('stem'),
    type: nodeType('stem-wall'),
    start: PlanPoint,
    end: PlanPoint,
    thickness: z.number().default(0.2032),
    height: z.number().default(0.6096),
}).describe(dedent `
  Stem wall node - authored foundation wall segment above a footing.
  - start/end: wall endpoints in plan coordinates
  - thickness/height: stem wall dimensions in meters
  `);
export const PierNode = BaseNode.extend({
    id: objectId('pier'),
    type: nodeType('pier'),
    center: PlanPoint,
    width: z.number().default(0.4064),
    depth: z.number().default(0.4064),
    height: z.number().default(0.6096),
}).describe(dedent `
  Pier node - authored isolated foundation support.
  - center: pier center in plan coordinates
  - width/depth/height: pier dimensions in meters
  `);
export const ColumnNode = BaseNode.extend({
    id: objectId('column'),
    type: nodeType('column'),
    center: PlanPoint,
    width: z.number().default(0.1524),
    depth: z.number().default(0.1524),
    height: z.number().default(2.4384),
    materialCode: z.string().default('lumber.spf.2x6'),
}).describe(dedent `
  Column node - authored vertical structural column.
  - center: column center in plan coordinates
  - width/depth/height: column dimensions in meters
  `);
export const FoundationSystemNode = BaseNode.extend({
    id: objectId('foundation'),
    type: nodeType('foundation-system'),
    children: z
        .array(z.union([
        FootingRunNode.shape.id,
        StemWallNode.shape.id,
        PierNode.shape.id,
        ColumnNode.shape.id,
    ]))
        .default([]),
    foundationKind: FoundationKind.default('crawlspace'),
    footingWidth: z.number().default(0.6096),
    footingDepth: z.number().default(0.3048),
    stemWallThickness: z.number().default(0.2032),
    rebarProfile: z.string().default('#4 @ 16" o.c.'),
}).describe(dedent `
  Foundation system node - authored foundation intent container.
  - foundationKind: slab-on-grade, crawlspace, or basement
  - footingWidth/footingDepth/stemWallThickness: project defaults in meters
  - children: footing, stem wall, pier, and column nodes
  `);
