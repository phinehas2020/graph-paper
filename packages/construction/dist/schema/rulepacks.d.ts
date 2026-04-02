import type { QuantityUnit } from './assemblies';
export type CostRule = {
    code: string;
    label: string;
    unit: QuantityUnit;
    unitCost: number;
    currency: string;
    uniformatCode: string;
    masterformatCode: string;
    defaultWasteFactor: number;
};
export type ConstructionRulePack = {
    id: string;
    label: string;
    locale: string;
    currency: string;
    compilerVersion?: string;
    defaults: {
        interiorWallAssemblyId: string;
        exteriorWallAssemblyId: string;
        floorAssemblyId: string;
        roofAssemblyId: string;
        finishAssemblyId: string;
        mepAssemblyId: string;
    };
    preferredStockLengths: number[];
    wasteFactors: {
        framing: number;
        sheathing: number;
        drywall: number;
        trim: number;
    };
    openingFallbacks: {
        defaultDoorSillHeight: number;
        defaultWindowSillHeight: number;
    };
    costRules: Record<string, CostRule>;
};
export type RulePack = ConstructionRulePack;
//# sourceMappingURL=rulepacks.d.ts.map