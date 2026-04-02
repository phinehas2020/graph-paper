import type { SceneGraph } from '@pascal-app/core/scene-graph';
import type { AssemblyCatalog, AssemblyDefinition } from '../schema/assemblies';
import type { ConstructionCompileResult } from '../schema/construction-graph';
import type { RulePack } from '../schema/rulepacks';
export type CompileConstructionOptions = {
    assemblies?: AssemblyDefinition[] | AssemblyCatalog;
    rulePack?: RulePack;
};
export declare function compileConstructionGraph(sceneGraph: SceneGraph, options?: CompileConstructionOptions): ConstructionCompileResult;
//# sourceMappingURL=index.d.ts.map