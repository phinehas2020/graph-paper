export function createEmptyEstimate(currency = 'USD') {
    return {
        lines: [],
        rollups: [],
        summary: {
            currency,
            subtotal: 0,
            total: 0,
        },
    };
}
export function buildEstimate(quantities, currency = quantities[0]?.currency ?? 'USD') {
    const lines = quantities
        .filter((quantity) => quantity.estimatedUnitCost !== undefined)
        .map((quantity) => ({
        id: `estimate:${quantity.id}`,
        wallId: quantity.wallId,
        quantityLineId: quantity.id,
        rollupKey: quantity.rollupKey,
        code: quantity.code,
        label: quantity.label,
        unit: quantity.unit,
        quantity: quantity.totalQuantity,
        unitCost: quantity.estimatedUnitCost,
        totalCost: quantity.estimatedTotalCost ?? quantity.totalQuantity * quantity.estimatedUnitCost,
        currency: quantity.currency ?? currency,
        uniformatCode: quantity.uniformatCode,
        masterformatCode: quantity.masterformatCode,
    }));
    const rollupMap = new Map();
    for (const line of lines) {
        const key = line.wallId ?? 'project';
        const existing = rollupMap.get(key);
        if (!existing) {
            rollupMap.set(key, {
                id: `rollup:${key}`,
                label: line.wallId ? `Wall ${line.wallId}` : 'Project total',
                totalCost: line.totalCost,
                currency: line.currency,
                wallId: line.wallId,
            });
            continue;
        }
        existing.totalCost += line.totalCost;
    }
    const subtotal = lines.reduce((sum, line) => sum + line.totalCost, 0);
    return {
        lines,
        rollups: Array.from(rollupMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
        summary: {
            currency,
            subtotal,
            total: subtotal,
        },
    };
}
