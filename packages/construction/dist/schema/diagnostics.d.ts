export type ConstructionDiagnosticLevel = 'info' | 'warning' | 'error';
export type ConstructionDiagnostic = {
    id: string;
    level: ConstructionDiagnosticLevel;
    code: string;
    message: string;
    sourceNodeId?: string;
    wallId?: string;
    openingId?: string;
    metadata?: Record<string, unknown>;
};
//# sourceMappingURL=diagnostics.d.ts.map