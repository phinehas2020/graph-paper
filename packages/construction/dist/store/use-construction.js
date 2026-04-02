import { create } from 'zustand';
import { DEFAULT_ASSEMBLY_CATALOG } from '../assemblies/defaults';
import { compileConstructionGraph } from '../compiler';
import { DEFAULT_RULE_PACK } from '../rulepacks/default-rulepack';
export const DEFAULT_CONSTRUCTION_WORKSPACE = {
    sceneGraph: null,
    rulePack: DEFAULT_RULE_PACK,
    assemblies: DEFAULT_ASSEMBLY_CATALOG,
};
export const useConstruction = create((set, get) => ({
    workspace: DEFAULT_CONSTRUCTION_WORKSPACE,
    compileResult: null,
    isCompiling: false,
    lastError: null,
    setWorkspace: (workspace) => set((state) => ({
        workspace: {
            ...state.workspace,
            ...workspace,
        },
    })),
    setCompileResult: (compileResult) => set({ compileResult }),
    compile: (sceneGraph, options) => {
        const nextSceneGraph = sceneGraph ?? get().workspace.sceneGraph;
        if (!nextSceneGraph) {
            set({ compileResult: null, lastError: null });
            return null;
        }
        set({ isCompiling: true, lastError: null });
        try {
            const workspace = get().workspace;
            const compileResult = compileConstructionGraph(nextSceneGraph, {
                ...options,
                assemblies: workspace.assemblies,
                rulePack: workspace.rulePack,
            });
            set({
                workspace: {
                    ...workspace,
                    sceneGraph: nextSceneGraph,
                },
                compileResult,
                isCompiling: false,
            });
            return compileResult;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Construction compile failed.';
            set({
                isCompiling: false,
                lastError: message,
            });
            return null;
        }
    },
    reset: () => set({
        workspace: DEFAULT_CONSTRUCTION_WORKSPACE,
        compileResult: null,
        isCompiling: false,
        lastError: null,
    }),
}));
