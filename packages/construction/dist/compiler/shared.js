import { buildEstimate } from '../estimate/build-estimate';
import { buildQuantityLines } from '../quantities/build-quantity-lines';
export function lineLength(start, end) {
    return Math.hypot(end[0] - start[0], end[1] - start[1]);
}
export function pathLength(path) {
    let total = 0;
    for (let index = 1; index < path.length; index += 1) {
        const previous = path[index - 1];
        const current = path[index];
        total += Math.hypot(current[0] - previous[0], current[1] - previous[1], current[2] - previous[2]);
    }
    return total;
}
export function polygonArea(points) {
    if (points.length < 3)
        return 0;
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        area += current[0] * next[1] - next[0] * current[1];
    }
    return Math.abs(area) / 2;
}
export function polygonPerimeter(points) {
    if (points.length < 2)
        return 0;
    let perimeter = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        perimeter += lineLength(current, next);
    }
    return perimeter;
}
export function polygonCentroid(points) {
    if (points.length === 0)
        return null;
    const [sumX, sumZ] = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
    return [sumX / points.length, sumZ / points.length];
}
export function polygonBounds(points) {
    if (points.length === 0) {
        return null;
    }
    let minX = points[0][0];
    let minZ = points[0][1];
    let maxX = points[0][0];
    let maxZ = points[0][1];
    points.forEach(([x, z]) => {
        minX = Math.min(minX, x);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxZ = Math.max(maxZ, z);
    });
    return {
        minX,
        minZ,
        maxX,
        maxZ,
        width: Math.max(maxX - minX, 0),
        depth: Math.max(maxZ - minZ, 0),
    };
}
export function createMember(input) {
    const start = input.start;
    const end = input.end;
    const span = start && end ? Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]) : 0.1;
    return {
        id: input.id,
        wallId: input.scopeId,
        levelId: input.levelId,
        sourceNodeId: input.sourceNodeId,
        assemblyId: input.assemblyId,
        type: input.type,
        category: input.category,
        label: input.label,
        materialCode: input.materialCode,
        unit: input.unit,
        quantity: input.quantity,
        count: input.count,
        geometry: {
            kind: 'box',
            face: 'center',
            localCenter: [0, 0, 0],
            localSize: [Math.max(span, 0.05), 0.05, 0.05],
        },
        start,
        end,
        metadata: input.metadata,
    };
}
export function createPointMember(input) {
    const height = input.height ?? 0.3;
    return createMember({
        ...input,
        start: [input.point[0], input.point[1], input.point[2]],
        end: [input.point[0], input.point[1] + height, input.point[2]],
    });
}
export function createSurfaceMember(input) {
    const centroid = input.centroid ?? [0, 0];
    const span = Math.max(input.span ?? 0.5, 0.25);
    const y = input.elevation ?? 0;
    return createMember({
        ...input,
        start: [centroid[0] - span / 2, y, centroid[1]],
        end: [centroid[0] + span / 2, y, centroid[1]],
    });
}
export function finalizeComponentResult(input) {
    const quantities = buildQuantityLines(input.members, input.rulePack);
    const estimate = buildEstimate(quantities, input.rulePack.currency);
    return {
        sourceNodeId: input.sourceNodeId,
        sourceNodeType: input.sourceNodeType,
        discipline: input.discipline,
        levelId: input.levelId,
        assemblyId: input.assemblyId,
        members: input.members,
        quantities,
        estimate,
        diagnostics: input.diagnostics ?? [],
        summary: {
            memberCount: input.members.length,
            quantityCount: quantities.length,
            estimatedCost: estimate.summary.total,
        },
    };
}
