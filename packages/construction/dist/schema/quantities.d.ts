import type { QuantityUnit } from './assemblies';
export type QuantityLine = {
    id: string;
    wallId?: string;
    assemblyId: string;
    rollupKey: string;
    code: string;
    label: string;
    unit: QuantityUnit;
    quantity: number;
    wasteFactor: number;
    totalQuantity: number;
    memberCount: number;
    sourceMemberIds: string[];
    uniformatCode: string;
    masterformatCode: string;
    estimatedUnitCost?: number;
    estimatedTotalCost?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
};
export type QuantitySummary = {
    lineCount: number;
    totalEstimatedCost: number;
    currency: string;
};
//# sourceMappingURL=quantities.d.ts.map