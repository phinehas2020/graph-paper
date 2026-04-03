import { type AnyNode, type SceneGraph, migrateSceneGraph } from '@pascal-app/core/construction-interop';
import type { AssemblyDefinition } from '../../schema/assemblies';
import type { ConstructionDiagnostic } from '../../schema/diagnostics';
import type { ConstructionTopology, SystemsSummaryRoom } from '../../schema/construction-graph';
import type { RulePack } from '../../schema/rulepacks';
export type CompilableSceneInput = SceneGraph;
export declare function buildConstructionTopology(sceneInput: CompilableSceneInput, assemblies: AssemblyDefinition[], rulePack: RulePack): {
    scene: ReturnType<typeof migrateSceneGraph>;
    nodes: Record<string, AnyNode>;
    topology: ConstructionTopology;
    diagnostics: ConstructionDiagnostic[];
    rooms: SystemsSummaryRoom[];
};
export declare const buildSceneTopology: typeof buildConstructionTopology;
export declare const extractTopology: typeof buildConstructionTopology;
//# sourceMappingURL=scene-topology.d.ts.map