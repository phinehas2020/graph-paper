import type { ConstructionPassResult } from '../../schema/construction-graph'
import { createEmptyEstimate } from '../../estimate/build-estimate'

export function compileMepSystems(currency = 'USD'): ConstructionPassResult {
  return {
    members: [],
    quantities: [],
    estimate: createEmptyEstimate(currency),
    diagnostics: [],
  }
}
