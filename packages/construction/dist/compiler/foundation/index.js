import { createMember, createPointMember, finalizeComponentResult } from '../shared';
export function compileFoundationSystems(topology, rulePack) {
    const results = [];
    topology.foundationSystems.forEach((system) => {
        const hasChildren = system.childIds.length > 0;
        results.push(finalizeComponentResult({
            sourceNodeId: system.sourceNodeId,
            sourceNodeType: 'foundation-system',
            discipline: 'foundation',
            levelId: system.levelId,
            assemblyId: system.assemblyId,
            members: [],
            diagnostics: hasChildren
                ? []
                : [
                    {
                        id: `foundation-empty:${system.foundationSystemId}`,
                        level: 'info',
                        code: 'construction.foundation.empty_system',
                        message: `Foundation system ${system.foundationSystemId} has no footing, stem wall, pier, or column members yet.`,
                        sourceNodeId: system.sourceNodeId,
                    },
                ],
            rulePack,
        }));
    });
    topology.footingRuns.forEach((footing) => {
        const volume = footing.length * footing.width * footing.thickness;
        results.push(finalizeComponentResult({
            sourceNodeId: footing.sourceNodeId,
            sourceNodeType: 'footing-run',
            discipline: 'foundation',
            levelId: footing.levelId,
            assemblyId: footing.assemblyId,
            members: [
                createMember({
                    id: `footing:${footing.footingRunId}`,
                    sourceNodeId: footing.sourceNodeId,
                    scopeId: footing.sourceNodeId,
                    levelId: footing.levelId,
                    assemblyId: footing.assemblyId,
                    type: 'footing',
                    category: 'foundation',
                    label: 'Continuous Footing',
                    materialCode: 'foundation.concrete.footing',
                    unit: 'cf',
                    quantity: volume,
                    count: 1,
                    start: [footing.start[0], -footing.depth, footing.start[1]],
                    end: [footing.end[0], -footing.depth, footing.end[1]],
                }),
            ],
            rulePack,
        }));
    });
    topology.stemWalls.forEach((stemWall) => {
        const volume = stemWall.length * stemWall.thickness * stemWall.height;
        results.push(finalizeComponentResult({
            sourceNodeId: stemWall.sourceNodeId,
            sourceNodeType: 'stem-wall',
            discipline: 'foundation',
            levelId: stemWall.levelId,
            assemblyId: stemWall.assemblyId,
            members: [
                createMember({
                    id: `stem-wall:${stemWall.stemWallId}`,
                    sourceNodeId: stemWall.sourceNodeId,
                    scopeId: stemWall.sourceNodeId,
                    levelId: stemWall.levelId,
                    assemblyId: stemWall.assemblyId,
                    type: 'stem-wall',
                    category: 'foundation',
                    label: 'Stem Wall',
                    materialCode: 'foundation.concrete.stem-wall',
                    unit: 'cf',
                    quantity: volume,
                    count: 1,
                    start: [stemWall.start[0], stemWall.height / 2, stemWall.start[1]],
                    end: [stemWall.end[0], stemWall.height / 2, stemWall.end[1]],
                }),
            ],
            rulePack,
        }));
    });
    topology.piers.forEach((pier) => {
        const volume = pier.width * pier.depth * pier.height;
        results.push(finalizeComponentResult({
            sourceNodeId: pier.sourceNodeId,
            sourceNodeType: 'pier',
            discipline: 'foundation',
            levelId: pier.levelId,
            assemblyId: pier.assemblyId,
            members: [
                createPointMember({
                    id: `pier:${pier.pierId}`,
                    sourceNodeId: pier.sourceNodeId,
                    scopeId: pier.sourceNodeId,
                    levelId: pier.levelId,
                    assemblyId: pier.assemblyId,
                    type: 'pier',
                    category: 'foundation',
                    label: 'Pier',
                    materialCode: 'foundation.concrete.pier',
                    unit: 'cf',
                    quantity: volume,
                    count: 1,
                    point: [pier.center[0], 0, pier.center[1]],
                    height: pier.height,
                }),
            ],
            rulePack,
        }));
    });
    topology.columns.forEach((column) => {
        results.push(finalizeComponentResult({
            sourceNodeId: column.sourceNodeId,
            sourceNodeType: 'column',
            discipline: 'foundation',
            levelId: column.levelId,
            assemblyId: column.assemblyId,
            members: [
                createPointMember({
                    id: `column:${column.columnId}`,
                    sourceNodeId: column.sourceNodeId,
                    scopeId: column.sourceNodeId,
                    levelId: column.levelId,
                    assemblyId: column.assemblyId,
                    type: 'column',
                    category: 'foundation',
                    label: 'Column',
                    materialCode: 'foundation.column.generic',
                    unit: 'ea',
                    quantity: 1,
                    count: 1,
                    point: [column.center[0], 0, column.center[1]],
                    height: column.height,
                }),
            ],
            rulePack,
        }));
    });
    return results;
}
