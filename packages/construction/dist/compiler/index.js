import { DEFAULT_ASSEMBLIES, DEFAULT_ASSEMBLY_CATALOG } from '../assemblies/defaults';
import { sortDiagnostics } from '../diagnostics';
import { buildEstimate } from '../estimate/build-estimate';
import { aggregateQuantityLines } from '../quantities/aggregate-quantities';
import { CONSTRUCTION_COMPILER_VERSION, DEFAULT_RULE_PACK } from '../rulepacks/default-rulepack';
import { buildConstructionTopology } from './topology/scene-topology';
import { compileWallFraming } from './wall-framing/compile-wall-framing';
function resolveAssemblyCatalog(assemblies) {
    if (!assemblies) {
        return DEFAULT_ASSEMBLY_CATALOG;
    }
    if (Array.isArray(assemblies)) {
        return Object.fromEntries(assemblies.map((assembly) => [assembly.id, assembly]));
    }
    return assemblies;
}
export function compileConstructionGraph(sceneGraph, options = {}) {
    const rulePack = options.rulePack ?? DEFAULT_RULE_PACK;
    const assemblyCatalog = resolveAssemblyCatalog(options.assemblies);
    const assemblies = Object.values(assemblyCatalog);
    const { scene, topology, diagnostics: topologyDiagnostics, rooms } = buildConstructionTopology(sceneGraph, assemblies, rulePack);
    const wallResults = topology.walls.flatMap((wall) => {
        const assembly = assemblyCatalog[wall.assemblyId];
        if (!(assembly && assembly.kind === 'wall')) {
            return [];
        }
        return [
            compileWallFraming({
                wall,
                assembly,
                rulePack,
            }),
        ];
    });
    const wallsById = Object.fromEntries(wallResults.map((result) => [result.wallId, result]));
    const members = wallResults.flatMap((result) => result.members);
    const quantities = aggregateQuantityLines(wallResults.flatMap((result) => result.quantities));
    const estimate = buildEstimate(quantities, rulePack.currency);
    const diagnostics = sortDiagnostics([
        ...topologyDiagnostics,
        ...wallResults.flatMap((result) => result.diagnostics),
    ]);
    return {
        sceneSchemaVersion: scene.sceneSchemaVersion,
        compilerVersion: rulePack.compilerVersion ?? CONSTRUCTION_COMPILER_VERSION,
        rulePackId: rulePack.id,
        generatedAt: new Date().toISOString(),
        assemblies: assemblies.length > 0 ? assemblies : DEFAULT_ASSEMBLIES,
        topology,
        wallResults,
        wallsById,
        members,
        quantities,
        estimate,
        diagnostics,
        rooms,
        summary: {
            wallCount: topology.walls.length,
            openingCount: topology.openingIds.length,
            memberCount: members.length,
            quantityCount: quantities.length,
            totalEstimatedCost: estimate.summary.total,
        },
    };
}
