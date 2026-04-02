import type { ConstructionCompileResult, WallCompileResult } from '../schema/construction-graph'

export function toConstructionExportSnapshot(
  result: ConstructionCompileResult,
): ConstructionCompileResult {
  return JSON.parse(JSON.stringify(result)) as ConstructionCompileResult
}

export function toWallExportSnapshot(result: WallCompileResult): WallCompileResult {
  return JSON.parse(JSON.stringify(result)) as WallCompileResult
}
