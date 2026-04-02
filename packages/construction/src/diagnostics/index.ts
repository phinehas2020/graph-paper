import type { ConstructionDiagnostic } from '../schema/diagnostics'

export function createDiagnostic(
  diagnostic: ConstructionDiagnostic,
): ConstructionDiagnostic {
  return diagnostic
}

export function sortDiagnostics(
  diagnostics: ConstructionDiagnostic[],
): ConstructionDiagnostic[] {
  const priority = {
    error: 0,
    warning: 1,
    info: 2,
  } as const

  return [...diagnostics].sort(
    (left, right) =>
      priority[left.level] - priority[right.level] || left.message.localeCompare(right.message),
  )
}

export type { ConstructionDiagnostic, ConstructionDiagnosticLevel } from '../schema/diagnostics'
