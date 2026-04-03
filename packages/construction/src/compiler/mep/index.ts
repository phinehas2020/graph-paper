import type {
  ConstructionComponentResult,
  ConstructionTopology,
} from '../../schema/construction-graph'
import type { ConstructionDiagnostic } from '../../schema/diagnostics'
import type { RulePack } from '../../schema/rulepacks'
import {
  createMember,
  createPointMember,
  finalizeComponentResult,
} from '../shared'

function getPathDiagnostics(id: string, sourceNodeId: string, length: number, label: string): ConstructionDiagnostic[] {
  if (length > 0) return []

  return [
    {
      id: `${label}-empty:${id}`,
      level: 'warning',
      code: `construction.${label}.empty_path`,
      message: `${label} ${id} needs at least two authored path points before it can generate takeoff.`,
      sourceNodeId,
    },
  ]
}

function getWireMaterialCode(wireType: string) {
  return /14[\/-]3/i.test(wireType) ? 'mep.wire.nm-b.14-3' : 'mep.wire.nm-b.12-2'
}

export function compileMepSystems(
  topology: ConstructionTopology,
  rulePack: RulePack,
): ConstructionComponentResult[] {
  const results: ConstructionComponentResult[] = []

  topology.electricalPanels.forEach((panel) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: panel.sourceNodeId,
        sourceNodeType: 'electrical-panel',
        discipline: 'electrical',
        levelId: panel.levelId,
        assemblyId: panel.assemblyId,
        members: [
          createPointMember({
            id: `panel:${panel.electricalPanelId}`,
            sourceNodeId: panel.sourceNodeId,
            scopeId: panel.sourceNodeId,
            levelId: panel.levelId,
            assemblyId: panel.assemblyId,
            type: 'panelboard',
            category: 'systems',
            label: 'Electrical Panel',
            materialCode: 'mep.panel.main',
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: panel.position,
            height: 0.5,
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.circuits.forEach((circuit) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: circuit.sourceNodeId,
        sourceNodeType: 'circuit',
        discipline: 'electrical',
        levelId: circuit.levelId,
        assemblyId: circuit.assemblyId,
        members: [
          createPointMember({
            id: `circuit:${circuit.circuitId}`,
            sourceNodeId: circuit.sourceNodeId,
            scopeId: circuit.sourceNodeId,
            levelId: circuit.levelId,
            assemblyId: circuit.assemblyId,
            type: 'circuit',
            category: 'systems',
            label: circuit.label,
            materialCode: 'electrical.circuit.generic',
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: [0, 0.2, 0],
            height: 0.25,
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.deviceBoxes.forEach((device) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: device.sourceNodeId,
        sourceNodeType: 'device-box',
        discipline: 'electrical',
        levelId: device.levelId,
        assemblyId: device.assemblyId,
        members: [
          createPointMember({
            id: `device:${device.deviceBoxId}`,
            sourceNodeId: device.sourceNodeId,
            scopeId: device.sourceNodeId,
            levelId: device.levelId,
            assemblyId: device.assemblyId,
            type: 'device',
            category: 'systems',
            label: 'Device Box',
            materialCode: 'mep.device.box',
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: device.position,
            height: 0.2,
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.lightFixtures.forEach((fixture) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: fixture.sourceNodeId,
        sourceNodeType: 'light-fixture',
        discipline: 'electrical',
        levelId: fixture.levelId,
        assemblyId: fixture.assemblyId,
        members: [
          createPointMember({
            id: `light:${fixture.lightFixtureId}`,
            sourceNodeId: fixture.sourceNodeId,
            scopeId: fixture.sourceNodeId,
            levelId: fixture.levelId,
            assemblyId: fixture.assemblyId,
            type: 'light-fixture',
            category: 'systems',
            label: 'Light Fixture',
            materialCode: 'mep.light.fixture',
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: fixture.position,
            height: 0.25,
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.wireRuns.forEach((wire) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: wire.sourceNodeId,
        sourceNodeType: 'wire-run',
        discipline: 'electrical',
        levelId: wire.levelId,
        assemblyId: wire.assemblyId,
        members:
          wire.length > 0
            ? [
                createMember({
                  id: `wire:${wire.wireRunId}`,
                  sourceNodeId: wire.sourceNodeId,
                  scopeId: wire.sourceNodeId,
                  levelId: wire.levelId,
                  assemblyId: wire.assemblyId,
                  type: 'wire',
                  category: 'systems',
                  label: wire.homerun ? 'Homerun Wire' : 'Branch Wire',
                  materialCode: getWireMaterialCode(wire.wireType),
                  unit: 'lf',
                  quantity: wire.length * 3.28084,
                  count: Math.max(1, wire.path.length - 1),
                  start: wire.path[0],
                  end: wire.path[wire.path.length - 1],
                }),
              ]
            : [],
        diagnostics: getPathDiagnostics(wire.wireRunId, wire.sourceNodeId, wire.length, 'wire-run'),
        rulePack,
      }),
    )
  })

  topology.switchLegs.forEach((wire) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: wire.sourceNodeId,
        sourceNodeType: 'switch-leg',
        discipline: 'electrical',
        levelId: wire.levelId,
        assemblyId: wire.assemblyId,
        members:
          wire.length > 0
            ? [
                createMember({
                  id: `switch-leg:${wire.switchLegId}`,
                  sourceNodeId: wire.sourceNodeId,
                  scopeId: wire.sourceNodeId,
                  levelId: wire.levelId,
                  assemblyId: wire.assemblyId,
                  type: 'switch-leg',
                  category: 'systems',
                  label: 'Switch Leg',
                  materialCode: getWireMaterialCode(wire.wireType),
                  unit: 'lf',
                  quantity: wire.length * 3.28084,
                  count: Math.max(1, wire.path.length - 1),
                  start: wire.path[0],
                  end: wire.path[wire.path.length - 1],
                }),
              ]
            : [],
        diagnostics: getPathDiagnostics(wire.switchLegId, wire.sourceNodeId, wire.length, 'switch-leg'),
        rulePack,
      }),
    )
  })

  topology.plumbingFixtures.forEach((fixture) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: fixture.sourceNodeId,
        sourceNodeType: 'plumbing-fixture',
        discipline: 'plumbing',
        levelId: fixture.levelId,
        assemblyId: fixture.assemblyId,
        members: [
          createPointMember({
            id: `plumbing-fixture:${fixture.plumbingFixtureId}`,
            sourceNodeId: fixture.sourceNodeId,
            scopeId: fixture.sourceNodeId,
            levelId: fixture.levelId,
            assemblyId: fixture.assemblyId,
            type: 'plumbing-fixture',
            category: 'systems',
            label: 'Plumbing Fixture',
            materialCode: 'plumbing.fixture.generic',
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: fixture.position,
            height: 0.3,
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.supplyRuns.forEach((run) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: run.sourceNodeId,
        sourceNodeType: 'supply-run',
        discipline: 'plumbing',
        levelId: run.levelId,
        assemblyId: run.assemblyId,
        members:
          run.length > 0
            ? [
                createMember({
                  id: `supply:${run.supplyRunId}`,
                  sourceNodeId: run.sourceNodeId,
                  scopeId: run.sourceNodeId,
                  levelId: run.levelId,
                  assemblyId: run.assemblyId,
                  type: 'pipe',
                  category: 'systems',
                  label: `${run.systemKind === 'hot' ? 'Hot' : 'Cold'} Supply`,
                  materialCode: 'plumbing.pipe.pex',
                  unit: 'lf',
                  quantity: run.length * 3.28084,
                  count: Math.max(1, run.path.length - 1),
                  start: run.path[0],
                  end: run.path[run.path.length - 1],
                }),
              ]
            : [],
        diagnostics: getPathDiagnostics(run.supplyRunId, run.sourceNodeId, run.length, 'supply-run'),
        rulePack,
      }),
    )
  })

  topology.drainRuns.forEach((run) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: run.sourceNodeId,
        sourceNodeType: 'drain-run',
        discipline: 'plumbing',
        levelId: run.levelId,
        assemblyId: run.assemblyId,
        members:
          run.length > 0
            ? [
                createMember({
                  id: `drain:${run.drainRunId}`,
                  sourceNodeId: run.sourceNodeId,
                  scopeId: run.sourceNodeId,
                  levelId: run.levelId,
                  assemblyId: run.assemblyId,
                  type: 'pipe',
                  category: 'systems',
                  label: 'Drain Line',
                  materialCode: 'plumbing.pipe.pvc',
                  unit: 'lf',
                  quantity: run.length * 3.28084,
                  count: Math.max(1, run.path.length - 1),
                  start: run.path[0],
                  end: run.path[run.path.length - 1],
                  metadata: { slope: run.slope },
                }),
              ]
            : [],
        diagnostics: getPathDiagnostics(run.drainRunId, run.sourceNodeId, run.length, 'drain-run'),
        rulePack,
      }),
    )
  })

  topology.ventRuns.forEach((run) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: run.sourceNodeId,
        sourceNodeType: 'vent-run',
        discipline: 'plumbing',
        levelId: run.levelId,
        assemblyId: run.assemblyId,
        members:
          run.length > 0
            ? [
                createMember({
                  id: `vent:${run.ventRunId}`,
                  sourceNodeId: run.sourceNodeId,
                  scopeId: run.sourceNodeId,
                  levelId: run.levelId,
                  assemblyId: run.assemblyId,
                  type: 'pipe',
                  category: 'systems',
                  label: 'Vent Line',
                  materialCode: 'plumbing.pipe.pvc',
                  unit: 'lf',
                  quantity: run.length * 3.28084,
                  count: Math.max(1, run.path.length - 1),
                  start: run.path[0],
                  end: run.path[run.path.length - 1],
                }),
              ]
            : [],
        diagnostics: getPathDiagnostics(run.ventRunId, run.sourceNodeId, run.length, 'vent-run'),
        rulePack,
      }),
    )
  })

  return results
}
