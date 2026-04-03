import dedent from 'dedent';
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from '../base';
const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export const DeviceBoxKind = z.enum(['outlet', 'switch', 'smoke-co', 'data', 'dedicated']);
export const LightFixtureKind = z.enum([
    'ceiling-light',
    'fan',
    'recessed',
    'exterior-light',
]);
export const CircuitKind = z.enum(['lighting', 'general', 'appliance', 'low-voltage']);
export const RunPathMode = z.enum(['manual', 'assisted']);
export const WireRunNode = BaseNode.extend({
    id: objectId('wire'),
    type: nodeType('wire-run'),
    path: z.array(Vec3).default([]),
    circuitId: z.string().nullable().default(null),
    wireType: z.string().default('NM-B 12/2'),
    homerun: z.boolean().default(false),
    pathMode: RunPathMode.default('manual'),
}).describe(dedent `
  Wire run node - authored electrical wire path.
  - path: ordered wire path points in level space
  - circuitId: optional owning circuit
  - homerun: whether this run is a homerun to the panel
  `);
export const SwitchLegNode = BaseNode.extend({
    id: objectId('sleg'),
    type: nodeType('switch-leg'),
    path: z.array(Vec3).default([]),
    circuitId: z.string().nullable().default(null),
    wireType: z.string().default('NM-B 14/3'),
}).describe(dedent `
  Switch leg node - authored switched conductor run.
  - path: ordered switch leg points in level space
  - circuitId: optional owning circuit
  `);
export const CircuitNode = BaseNode.extend({
    id: objectId('circuit'),
    type: nodeType('circuit'),
    children: z.array(z.union([WireRunNode.shape.id, SwitchLegNode.shape.id])).default([]),
    label: z.string().default('Circuit'),
    breakerAmps: z.number().default(20),
    voltage: z.number().default(120),
    circuitType: CircuitKind.default('general'),
}).describe(dedent `
  Circuit node - authored electrical circuit definition.
  - breakerAmps: nominal breaker size
  - voltage: branch voltage
  - circuitType: use classification for defaults and reports
  `);
export const ElectricalPanelNode = BaseNode.extend({
    id: objectId('epanel'),
    type: nodeType('electrical-panel'),
    children: z.array(CircuitNode.shape.id).default([]),
    position: Vec3.default([0, 1.8, 0]),
    amperage: z.number().default(200),
    voltage: z.number().default(240),
    mainBreakerAmps: z.number().default(200),
}).describe(dedent `
  Electrical panel node - authored service/panelboard location.
  - position: panel position in level space
  - amperage/voltage: panel service characteristics
  `);
export const DeviceBoxNode = BaseNode.extend({
    id: objectId('device'),
    type: nodeType('device-box'),
    position: Vec3.default([0, 0.4572, 0]),
    deviceType: DeviceBoxKind.default('outlet'),
    wallId: z.string().nullable().default(null),
    circuitId: z.string().nullable().default(null),
    mountHeight: z.number().default(0.4572),
    voltage: z.number().default(120),
    wireType: z.string().default('NM-B 12/2'),
}).describe(dedent `
  Device box node - authored electrical wall device.
  - position: box position in level space
  - deviceType: outlet, switch, detector, or low-voltage point
  - wallId: optional hosting wall
  - mountHeight: nominal mounting height in meters
  `);
export const LightFixtureNode = BaseNode.extend({
    id: objectId('fixture'),
    type: nodeType('light-fixture'),
    position: Vec3.default([0, 2.4384, 0]),
    fixtureType: LightFixtureKind.default('ceiling-light'),
    circuitId: z.string().nullable().default(null),
    mountHeight: z.number().default(2.4384),
}).describe(dedent `
  Light fixture node - authored luminaire placement.
  - position: fixture position in level space
  - fixtureType: fixture family for defaults and schedules
  - mountHeight: installation height in meters
  `);
