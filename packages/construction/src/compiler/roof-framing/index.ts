import type { ConstructionPassResult } from '../../schema/construction-graph'
import { createEmptyEstimate } from '../../estimate/build-estimate'

export function compileRoofFraming(currency = 'USD'): ConstructionPassResult {
  return {
    members: [],
    quantities: [],
    estimate: createEmptyEstimate(currency),
    diagnostics: [],
  }
}
