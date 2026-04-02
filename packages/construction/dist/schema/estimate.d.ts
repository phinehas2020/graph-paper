import type { QuantityUnit } from './assemblies';
export type EstimateLine = {
    id: string;
    wallId?: string;
    quantityLineId: string;
    rollupKey: string;
    code: string;
    label: string;
    unit: QuantityUnit;
    quantity: number;
    unitCost: number;
    totalCost: number;
    currency: string;
    uniformatCode: string;
    masterformatCode: string;
};
export type EstimateRollup = {
    id: string;
    label: string;
    totalCost: number;
    currency: string;
    wallId?: string;
};
export type EstimateSummary = {
    currency: string;
    subtotal: number;
    total: number;
};
export type ConstructionEstimate = {
    lines: EstimateLine[];
    rollups: EstimateRollup[];
    summary: EstimateSummary;
};
//# sourceMappingURL=estimate.d.ts.map