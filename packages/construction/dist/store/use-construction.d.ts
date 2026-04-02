import { type CompileConstructionOptions } from '../compiler';
import type { AssemblyCatalog } from '../schema/assemblies';
import type { ConstructionCompileResult } from '../schema/construction-graph';
import type { RulePack } from '../schema/rulepacks';
import type { SceneGraph } from '@pascal-app/core/scene-graph';
export type ConstructionWorkspace = {
    sceneGraph: SceneGraph | null;
    rulePack: RulePack;
    assemblies: AssemblyCatalog;
};
export declare const DEFAULT_CONSTRUCTION_WORKSPACE: ConstructionWorkspace;
type ConstructionState = {
    workspace: ConstructionWorkspace;
    compileResult: ConstructionCompileResult | null;
    isCompiling: boolean;
    lastError: string | null;
    setWorkspace: (workspace: Partial<ConstructionWorkspace>) => void;
    setCompileResult: (compileResult: ConstructionCompileResult | null) => void;
    compile: (sceneGraph?: SceneGraph | null, options?: Omit<CompileConstructionOptions, 'assemblies' | 'rulePack'>) => ConstructionCompileResult | null;
    reset: () => void;
};
export declare const useConstruction: import("zustand").UseBoundStore<import("zustand").StoreApi<ConstructionState>>;
export {};
//# sourceMappingURL=use-construction.d.ts.map