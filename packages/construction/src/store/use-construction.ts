import { create } from 'zustand'
import { DEFAULT_ASSEMBLY_CATALOG } from '../assemblies/defaults'
import { compileConstructionGraph, type CompileConstructionOptions } from '../compiler'
import { DEFAULT_RULE_PACK } from '../rulepacks/default-rulepack'
import type { AssemblyCatalog } from '../schema/assemblies'
import type { ConstructionCompileResult } from '../schema/construction-graph'
import type { RulePack } from '../schema/rulepacks'
import type { SceneGraph } from '@pascal-app/core/scene-graph'

export type ConstructionWorkspace = {
  sceneGraph: SceneGraph | null
  rulePack: RulePack
  assemblies: AssemblyCatalog
}

export const DEFAULT_CONSTRUCTION_WORKSPACE: ConstructionWorkspace = {
  sceneGraph: null,
  rulePack: DEFAULT_RULE_PACK,
  assemblies: DEFAULT_ASSEMBLY_CATALOG,
}

type ConstructionState = {
  workspace: ConstructionWorkspace
  compileResult: ConstructionCompileResult | null
  isCompiling: boolean
  lastError: string | null
  setWorkspace: (workspace: Partial<ConstructionWorkspace>) => void
  setCompileResult: (compileResult: ConstructionCompileResult | null) => void
  compile: (sceneGraph?: SceneGraph | null, options?: Omit<CompileConstructionOptions, 'assemblies' | 'rulePack'>) => ConstructionCompileResult | null
  reset: () => void
}

export const useConstruction = create<ConstructionState>((set, get) => ({
  workspace: DEFAULT_CONSTRUCTION_WORKSPACE,
  compileResult: null,
  isCompiling: false,
  lastError: null,
  setWorkspace: (workspace) =>
    set((state) => ({
      workspace: {
        ...state.workspace,
        ...workspace,
      },
    })),
  setCompileResult: (compileResult) => set({ compileResult }),
  compile: (sceneGraph, options) => {
    const nextSceneGraph = sceneGraph ?? get().workspace.sceneGraph
    if (!nextSceneGraph) {
      set({ compileResult: null, lastError: null })
      return null
    }

    set({ isCompiling: true, lastError: null })

    try {
      const workspace = get().workspace
      const compileResult = compileConstructionGraph(nextSceneGraph, {
        ...options,
        assemblies: workspace.assemblies,
        rulePack: workspace.rulePack,
      })

      set({
        workspace: {
          ...workspace,
          sceneGraph: nextSceneGraph,
        },
        compileResult,
        isCompiling: false,
      })

      return compileResult
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Construction compile failed.'
      set({
        isCompiling: false,
        lastError: message,
      })
      return null
    }
  },
  reset: () =>
    set({
      workspace: DEFAULT_CONSTRUCTION_WORKSPACE,
      compileResult: null,
      isCompiling: false,
      lastError: null,
    }),
}))
