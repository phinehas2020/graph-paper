export function aggregateQuantityLines(lines) {
    const aggregated = new Map();
    for (const line of lines) {
        const key = [line.assemblyId, line.code, line.unit].join(':');
        const existing = aggregated.get(key);
        if (!existing) {
            aggregated.set(key, {
                ...line,
                id: key,
                wallId: undefined,
                rollupKey: `material:${line.code}`,
                sourceMemberIds: [...line.sourceMemberIds],
            });
            continue;
        }
        existing.quantity += line.quantity;
        existing.totalQuantity = existing.quantity * (1 + existing.wasteFactor);
        existing.memberCount += line.memberCount;
        existing.sourceMemberIds.push(...line.sourceMemberIds);
        if (existing.estimatedUnitCost !== undefined) {
            existing.estimatedTotalCost = existing.totalQuantity * existing.estimatedUnitCost;
        }
    }
    return Array.from(aggregated.values()).sort((left, right) => left.label.localeCompare(right.label));
}
export const aggregateQuantities = aggregateQuantityLines;
