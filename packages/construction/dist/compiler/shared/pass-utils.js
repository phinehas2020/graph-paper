export function distance2D(start, end) {
    return Math.hypot(end[0] - start[0], end[1] - start[1]);
}
export function distance3D(start, end) {
    return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}
export function polygonArea2D(points) {
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
export function centroid2D(points) {
    if (points.length === 0)
        return null;
    const [x, z] = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
    return [x / points.length, z / points.length];
}
export function getPlanBasis(angleRadians) {
    const direction = [Math.cos(angleRadians), Math.sin(angleRadians)];
    const normal = [-direction[1], direction[0]];
    return { direction, normal };
}
export function projectPlanPoint(point, axis) {
    return point[0] * axis[0] + point[1] * axis[1];
}
export function getProjectedBounds(points, angleRadians) {
    const { direction, normal } = getPlanBasis(angleRadians);
    const directionValues = points.map((point) => projectPlanPoint(point, direction));
    const normalValues = points.map((point) => projectPlanPoint(point, normal));
    return {
        direction,
        normal,
        minAlongDirection: Math.min(...directionValues),
        maxAlongDirection: Math.max(...directionValues),
        minAlongNormal: Math.min(...normalValues),
        maxAlongNormal: Math.max(...normalValues),
    };
}
export function fromBasis(alongDirection, alongNormal, direction, normal) {
    return [
        direction[0] * alongDirection + normal[0] * alongNormal,
        direction[1] * alongDirection + normal[1] * alongNormal,
    ];
}
export function createLinearMember(input) {
    const length = distance3D(input.start, input.end);
    const thickness = Math.max(input.thickness ?? 0.0381, 0.01);
    const depth = Math.max(input.depth ?? thickness, 0.01);
    return {
        id: input.id,
        wallId: input.wallId,
        levelId: input.levelId,
        sourceNodeId: input.sourceNodeId,
        assemblyId: input.assemblyId,
        type: input.type,
        category: input.category,
        label: input.label,
        materialCode: input.materialCode,
        unit: input.unit,
        quantity: input.quantity,
        count: input.count ?? 1,
        geometry: {
            kind: 'box',
            face: 'center',
            localCenter: [
                (input.start[0] + input.end[0]) / 2,
                (input.start[1] + input.end[1]) / 2,
                (input.start[2] + input.end[2]) / 2,
            ],
            localSize: [Math.max(length, 0.01), depth, thickness],
            localStart: input.start,
            localEnd: input.end,
        },
        start: input.start,
        end: input.end,
        metadata: input.metadata,
    };
}
export function createPointMember(input) {
    const size = input.size ?? [0.1524, 0.1524, 0.1524];
    const start = [input.center[0], input.center[1] - size[1] / 2, input.center[2]];
    const end = [input.center[0], input.center[1] + size[1] / 2, input.center[2]];
    return {
        id: input.id,
        wallId: input.wallId,
        levelId: input.levelId,
        sourceNodeId: input.sourceNodeId,
        assemblyId: input.assemblyId,
        type: input.type,
        category: input.category,
        label: input.label,
        materialCode: input.materialCode,
        unit: input.unit,
        quantity: input.quantity,
        count: input.count ?? 1,
        geometry: {
            kind: 'box',
            face: 'center',
            localCenter: input.center,
            localSize: size,
            localStart: start,
            localEnd: end,
        },
        start,
        end,
        metadata: input.metadata,
    };
}
