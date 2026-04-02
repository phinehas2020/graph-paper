import {} from '../../schema/construction-graph';
import { buildEstimate, createEmptyEstimate } from '../../estimate/build-estimate';
import { buildQuantityLines } from '../../quantities/build-quantity-lines';
const EPSILON = 0.0001;
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getWallBasis(wall) {
    const dx = wall.end[0] - wall.start[0];
    const dz = wall.end[1] - wall.start[1];
    const length = Math.hypot(dx, dz) || 1;
    return {
        direction: [dx / length, dz / length],
        normal: [-dz / length, dx / length],
    };
}
function localToWorld(wall, basis, local) {
    return [
        wall.start[0] + basis.direction[0] * local[0] + basis.normal[0] * local[2],
        local[1],
        wall.start[1] + basis.direction[1] * local[0] + basis.normal[1] * local[2],
    ];
}
function getFaceZ(wall, face, thickness) {
    if (face === 'center')
        return 0;
    const sign = face === 'exterior' ? 1 : -1;
    return sign * Math.max(0, wall.thickness / 2 - thickness / 2);
}
function createMemberFactory(wall, assembly) {
    const basis = getWallBasis(wall);
    let index = 0;
    return (input) => {
        const face = input.face ?? 'center';
        return {
            id: `${wall.wallId}:${input.type}:${index += 1}`,
            wallId: wall.wallId,
            levelId: wall.levelId,
            sourceNodeId: input.sourceNodeId,
            assemblyId: assembly.id,
            type: input.type,
            category: input.category,
            label: input.label,
            materialCode: input.materialCode,
            unit: input.unit,
            quantity: input.quantity,
            count: input.count ?? 1,
            geometry: {
                kind: 'box',
                face,
                localCenter: input.localCenter,
                localSize: input.localSize,
                localStart: input.localStart,
                localEnd: input.localEnd,
            },
            start: input.localStart ? localToWorld(wall, basis, input.localStart) : undefined,
            end: input.localEnd ? localToWorld(wall, basis, input.localEnd) : undefined,
            metadata: input.metadata,
        };
    };
}
function openingBounds(opening) {
    return {
        left: opening.centerOffset - opening.width / 2,
        right: opening.centerOffset + opening.width / 2,
    };
}
function getStudLayout(opening, assembly) {
    const studThickness = assembly.stud.actualThickness;
    const { left, right } = openingBounds(opening);
    const leftJacks = Array.from({ length: assembly.openingFraming.jackStudsPerSide }, (_, index) => left - studThickness / 2 - index * studThickness);
    const rightJacks = Array.from({ length: assembly.openingFraming.jackStudsPerSide }, (_, index) => right + studThickness / 2 + index * studThickness);
    const leftKings = Array.from({ length: assembly.openingFraming.kingStudsPerSide }, (_, index) => leftJacks[leftJacks.length - 1] - studThickness * (index + 1));
    const rightKings = Array.from({ length: assembly.openingFraming.kingStudsPerSide }, (_, index) => rightJacks[rightJacks.length - 1] + studThickness * (index + 1));
    return {
        left,
        right,
        leftJacks,
        rightJacks,
        leftKings,
        rightKings,
        reservedStart: (leftKings[leftKings.length - 1] ?? leftJacks[leftJacks.length - 1] ?? left) - studThickness / 2,
        reservedEnd: (rightKings[rightKings.length - 1] ?? rightJacks[rightJacks.length - 1] ?? right) + studThickness / 2,
    };
}
function getCommonStudCenters(wall, assembly) {
    const studThickness = assembly.stud.actualThickness;
    const reservedRanges = wall.openings.map((opening) => {
        const layout = getStudLayout(opening, assembly);
        return [layout.reservedStart, layout.reservedEnd];
    });
    const centers = new Set();
    const addCenter = (center) => {
        const clamped = clamp(center, studThickness / 2, wall.length - studThickness / 2);
        const insideReservedRange = reservedRanges.some(([min, max]) => clamped >= min - EPSILON && clamped <= max + EPSILON);
        if (!insideReservedRange) {
            centers.add(Number(clamped.toFixed(4)));
        }
    };
    addCenter(studThickness / 2);
    addCenter(wall.length - studThickness / 2);
    for (let cursor = assembly.studSpacing; cursor < wall.length; cursor += assembly.studSpacing) {
        addCenter(cursor);
    }
    return Array.from(centers).sort((left, right) => left - right);
}
function subtractRect(rect, cut) {
    const overlapLeft = Math.max(rect.x, cut.x);
    const overlapRight = Math.min(rect.x + rect.width, cut.x + cut.width);
    const overlapBottom = Math.max(rect.y, cut.y);
    const overlapTop = Math.min(rect.y + rect.height, cut.y + cut.height);
    if (overlapLeft >= overlapRight || overlapBottom >= overlapTop) {
        return [rect];
    }
    const fragments = [];
    if (overlapBottom > rect.y + EPSILON) {
        fragments.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: overlapBottom - rect.y,
        });
    }
    if (overlapTop < rect.y + rect.height - EPSILON) {
        fragments.push({
            x: rect.x,
            y: overlapTop,
            width: rect.width,
            height: rect.y + rect.height - overlapTop,
        });
    }
    if (overlapLeft > rect.x + EPSILON) {
        fragments.push({
            x: rect.x,
            y: overlapBottom,
            width: overlapLeft - rect.x,
            height: overlapTop - overlapBottom,
        });
    }
    if (overlapRight < rect.x + rect.width - EPSILON) {
        fragments.push({
            x: overlapRight,
            y: overlapBottom,
            width: rect.x + rect.width - overlapRight,
            height: overlapTop - overlapBottom,
        });
    }
    return fragments.filter((fragment) => fragment.width > EPSILON && fragment.height > EPSILON);
}
function getSurfaceRects(wall) {
    let rects = [
        {
            x: 0,
            y: 0,
            width: wall.length,
            height: wall.height,
        },
    ];
    for (const opening of wall.openings) {
        const openingRect = {
            x: Math.max(0, opening.centerOffset - opening.width / 2),
            y: Math.max(0, opening.sillHeight),
            width: Math.min(wall.length, opening.width),
            height: Math.max(0, Math.min(wall.height, opening.headHeight) - Math.max(0, opening.sillHeight)),
        };
        rects = rects.flatMap((rect) => subtractRect(rect, openingRect));
    }
    return rects;
}
function tileRect(rect, sheetWidth, sheetHeight) {
    const tiles = [];
    for (let y = rect.y; y < rect.y + rect.height - EPSILON; y += sheetHeight) {
        const currentHeight = Math.min(sheetHeight, rect.y + rect.height - y);
        for (let x = rect.x; x < rect.x + rect.width - EPSILON; x += sheetWidth) {
            const currentWidth = Math.min(sheetWidth, rect.x + rect.width - x);
            tiles.push({
                x,
                y,
                width: currentWidth,
                height: currentHeight,
            });
        }
    }
    return tiles;
}
function getFinishFaces(faceCount, wall, defaultSingleFace) {
    if (faceCount <= 0)
        return [];
    if (faceCount === 1) {
        return [wall.isExterior ? defaultSingleFace : 'interior'];
    }
    return ['interior', 'exterior'];
}
function addSurfaceMembers(members, createMember, wall, assembly, type, face) {
    const spec = type === 'sheathing' ? assembly.sheathing : assembly.drywall;
    const sheetArea = spec.sheetWidth * spec.sheetHeight;
    const category = type === 'sheathing' ? 'envelope' : 'finish';
    const z = getFaceZ(wall, face, spec.thickness);
    for (const rect of getSurfaceRects(wall)) {
        for (const tile of tileRect(rect, spec.sheetWidth, spec.sheetHeight)) {
            const area = tile.width * tile.height;
            members.push(createMember({
                sourceNodeId: wall.wallId,
                type,
                category,
                label: type === 'sheathing' ? 'Sheathing panel' : 'Drywall panel',
                materialCode: spec.materialCode,
                unit: 'sheet',
                quantity: area / sheetArea,
                localCenter: [tile.x + tile.width / 2, tile.y + tile.height / 2, z],
                localSize: [tile.width, tile.height, spec.thickness],
                face,
                metadata: {
                    area,
                },
            }));
        }
    }
}
function addTrimMembers(members, createMember, wall, assembly, opening, face) {
    if (!assembly.trim.enabled)
        return;
    const { casingWidth, thickness, materialCode } = assembly.trim;
    const z = getFaceZ(wall, face, thickness);
    const left = opening.centerOffset - opening.width / 2;
    const right = opening.centerOffset + opening.width / 2;
    const top = opening.headHeight;
    const bottom = opening.sillHeight;
    const sideLength = top - bottom;
    const headerLength = opening.width + casingWidth * 2;
    const verticalPieces = [
        {
            x: left - casingWidth / 2,
            y: bottom + sideLength / 2,
            length: sideLength,
        },
        {
            x: right + casingWidth / 2,
            y: bottom + sideLength / 2,
            length: sideLength,
        },
    ];
    for (const piece of verticalPieces) {
        members.push(createMember({
            sourceNodeId: opening.sourceNodeId,
            type: 'trim',
            category: 'finish',
            label: opening.type === 'door' ? 'Door casing' : 'Window casing',
            materialCode,
            unit: 'lf',
            quantity: piece.length,
            localCenter: [piece.x, piece.y, z],
            localSize: [casingWidth, piece.length, thickness],
            localStart: [piece.x, bottom, 0],
            localEnd: [piece.x, top, 0],
            face,
            metadata: {
                openingId: opening.openingId,
                piece: 'side',
            },
        }));
    }
    members.push(createMember({
        sourceNodeId: opening.sourceNodeId,
        type: 'trim',
        category: 'finish',
        label: opening.type === 'door' ? 'Door head casing' : 'Window head casing',
        materialCode,
        unit: 'lf',
        quantity: headerLength,
        localCenter: [opening.centerOffset, top + casingWidth / 2, z],
        localSize: [headerLength, casingWidth, thickness],
        localStart: [opening.centerOffset - headerLength / 2, top + casingWidth / 2, 0],
        localEnd: [opening.centerOffset + headerLength / 2, top + casingWidth / 2, 0],
        face,
        metadata: {
            openingId: opening.openingId,
            piece: 'head',
        },
    }));
    if (opening.type === 'window') {
        members.push(createMember({
            sourceNodeId: opening.sourceNodeId,
            type: 'trim',
            category: 'finish',
            label: 'Window sill casing',
            materialCode,
            unit: 'lf',
            quantity: headerLength,
            localCenter: [opening.centerOffset, bottom - casingWidth / 2, z],
            localSize: [headerLength, casingWidth, thickness],
            localStart: [opening.centerOffset - headerLength / 2, bottom - casingWidth / 2, 0],
            localEnd: [opening.centerOffset + headerLength / 2, bottom - casingWidth / 2, 0],
            face,
            metadata: {
                openingId: opening.openingId,
                piece: 'sill',
            },
        }));
    }
}
export function compileWallFraming(input) {
    const { wall, assembly, rulePack } = input;
    const diagnostics = [];
    const members = [];
    const createMember = createMemberFactory(wall, assembly);
    const studThickness = assembly.stud.actualThickness;
    const studDepth = assembly.stud.actualDepth;
    const plateThickness = assembly.plate.actualThickness;
    const plateDepth = assembly.plate.actualDepth;
    const bottomPlateHeight = assembly.bottomPlateCount * plateThickness;
    const topPlateHeight = assembly.topPlateCount * plateThickness;
    const studBottom = bottomPlateHeight;
    const studTop = Math.max(studBottom, wall.height - topPlateHeight);
    if (wall.length <= EPSILON || wall.height <= EPSILON) {
        diagnostics.push({
            id: `wall-not-compiled:${wall.wallId}`,
            level: 'warning',
            code: 'construction.wall.not_compiled',
            message: `Wall ${wall.wallId} has invalid dimensions and did not emit framing members.`,
            sourceNodeId: wall.wallId,
            wallId: wall.wallId,
        });
        return {
            wallId: wall.wallId,
            levelId: wall.levelId,
            assemblyId: assembly.id,
            wall,
            assembly,
            members: [],
            quantities: [],
            estimate: createEmptyEstimate(rulePack.currency),
            diagnostics,
            summary: {
                openingCount: wall.openings.length,
                memberCount: 0,
                quantityCount: 0,
                estimatedCost: 0,
            },
        };
    }
    for (let index = 0; index < assembly.bottomPlateCount; index += 1) {
        const y = plateThickness / 2 + index * plateThickness;
        members.push(createMember({
            sourceNodeId: wall.wallId,
            type: 'plate',
            category: 'framing',
            label: 'Bottom plate',
            materialCode: assembly.plate.materialCode,
            unit: 'lf',
            quantity: wall.length,
            localCenter: [wall.length / 2, y, 0],
            localSize: [wall.length, plateThickness, plateDepth],
            localStart: [0, y, 0],
            localEnd: [wall.length, y, 0],
        }));
    }
    for (let index = 0; index < assembly.topPlateCount; index += 1) {
        const y = wall.height - plateThickness / 2 - index * plateThickness;
        members.push(createMember({
            sourceNodeId: wall.wallId,
            type: 'plate',
            category: 'framing',
            label: index === 0 ? 'Top plate' : 'Cap plate',
            materialCode: assembly.plate.materialCode,
            unit: 'lf',
            quantity: wall.length,
            localCenter: [wall.length / 2, y, 0],
            localSize: [wall.length, plateThickness, plateDepth],
            localStart: [0, y, 0],
            localEnd: [wall.length, y, 0],
        }));
    }
    for (const center of getCommonStudCenters(wall, assembly)) {
        const studLength = Math.max(EPSILON, studTop - studBottom);
        members.push(createMember({
            sourceNodeId: wall.wallId,
            type: 'stud',
            category: 'framing',
            label: 'Common stud',
            materialCode: assembly.stud.materialCode,
            unit: 'lf',
            quantity: studLength,
            localCenter: [center, studBottom + studLength / 2, 0],
            localSize: [studThickness, studLength, studDepth],
            localStart: [center, studBottom, 0],
            localEnd: [center, studBottom + studLength, 0],
            metadata: {
                centerOffset: center,
            },
        }));
    }
    for (const opening of wall.openings) {
        const layout = getStudLayout(opening, assembly);
        const headerBottom = clamp(opening.headHeight, studBottom, studTop - assembly.header.actualDepth);
        const headerLength = opening.width + assembly.openingFraming.headerBearingLength * 2;
        const headerLeft = clamp(opening.centerOffset - headerLength / 2, 0, wall.length);
        const headerRight = clamp(opening.centerOffset + headerLength / 2, 0, wall.length);
        const headerSpan = Math.max(EPSILON, headerRight - headerLeft);
        const headerCenterY = headerBottom + assembly.header.actualDepth / 2;
        members.push(createMember({
            sourceNodeId: opening.sourceNodeId,
            type: 'header',
            category: 'framing',
            label: opening.type === 'door'
                ? 'Door header'
                : opening.type === 'window'
                    ? 'Window header'
                    : 'Wall opening header',
            materialCode: assembly.header.materialCode,
            unit: 'lf',
            quantity: headerSpan,
            localCenter: [opening.centerOffset, headerCenterY, 0],
            localSize: [headerSpan, assembly.header.actualDepth, assembly.stud.actualDepth],
            localStart: [headerLeft, headerCenterY, 0],
            localEnd: [headerRight, headerCenterY, 0],
            metadata: {
                openingId: opening.openingId,
            },
        }));
        const studGroups = [
            {
                type: 'king-stud',
                centers: [...layout.leftKings, ...layout.rightKings],
                top: studTop,
                label: 'King stud',
            },
            {
                type: 'jack-stud',
                centers: [...layout.leftJacks, ...layout.rightJacks],
                top: headerBottom,
                label: 'Jack stud',
            },
        ];
        for (const group of studGroups) {
            for (const center of group.centers) {
                const studLength = Math.max(EPSILON, group.top - studBottom);
                members.push(createMember({
                    sourceNodeId: opening.sourceNodeId,
                    type: group.type,
                    category: 'framing',
                    label: group.label,
                    materialCode: assembly.stud.materialCode,
                    unit: 'lf',
                    quantity: studLength,
                    localCenter: [center, studBottom + studLength / 2, 0],
                    localSize: [studThickness, studLength, studDepth],
                    localStart: [center, studBottom, 0],
                    localEnd: [center, studBottom + studLength, 0],
                    metadata: {
                        openingId: opening.openingId,
                    },
                }));
            }
        }
        if (opening.type === 'window') {
            const sillLength = Math.max(EPSILON, layout.right - layout.left);
            const sillY = opening.sillHeight + assembly.blocking.actualDepth / 2;
            for (let index = 0; index < assembly.openingFraming.sillMemberCount; index += 1) {
                const y = sillY + index * assembly.blocking.actualDepth;
                members.push(createMember({
                    sourceNodeId: opening.sourceNodeId,
                    type: 'blocking',
                    category: 'framing',
                    label: 'Window rough sill',
                    materialCode: assembly.blocking.materialCode,
                    unit: 'lf',
                    quantity: sillLength,
                    localCenter: [opening.centerOffset, y, 0],
                    localSize: [sillLength, assembly.blocking.actualDepth, studDepth],
                    localStart: [layout.left, y, 0],
                    localEnd: [layout.right, y, 0],
                    metadata: {
                        openingId: opening.openingId,
                    },
                }));
            }
        }
        const crippleSpacing = assembly.openingFraming.crippleSpacing ?? assembly.studSpacing;
        for (let cursor = layout.left + crippleSpacing; cursor < layout.right - crippleSpacing / 2; cursor += crippleSpacing) {
            if (headerBottom + assembly.header.actualDepth < studTop - EPSILON) {
                const topCrippleBottom = headerBottom + assembly.header.actualDepth;
                const topCrippleLength = studTop - topCrippleBottom;
                members.push(createMember({
                    sourceNodeId: opening.sourceNodeId,
                    type: 'cripple-stud',
                    category: 'framing',
                    label: 'Top cripple',
                    materialCode: assembly.stud.materialCode,
                    unit: 'lf',
                    quantity: topCrippleLength,
                    localCenter: [cursor, topCrippleBottom + topCrippleLength / 2, 0],
                    localSize: [studThickness, topCrippleLength, studDepth],
                    localStart: [cursor, topCrippleBottom, 0],
                    localEnd: [cursor, studTop, 0],
                    metadata: {
                        openingId: opening.openingId,
                    },
                }));
            }
            if (opening.type === 'window' && opening.sillHeight > studBottom + EPSILON) {
                const bottomCrippleLength = opening.sillHeight - studBottom;
                members.push(createMember({
                    sourceNodeId: opening.sourceNodeId,
                    type: 'cripple-stud',
                    category: 'framing',
                    label: 'Bottom cripple',
                    materialCode: assembly.stud.materialCode,
                    unit: 'lf',
                    quantity: bottomCrippleLength,
                    localCenter: [cursor, studBottom + bottomCrippleLength / 2, 0],
                    localSize: [studThickness, bottomCrippleLength, studDepth],
                    localStart: [cursor, studBottom, 0],
                    localEnd: [cursor, opening.sillHeight, 0],
                    metadata: {
                        openingId: opening.openingId,
                    },
                }));
            }
        }
    }
    for (const face of getFinishFaces(assembly.sheathing.faces, wall, 'exterior')) {
        addSurfaceMembers(members, createMember, wall, assembly, 'sheathing', face);
    }
    for (const face of getFinishFaces(assembly.drywall.faces, wall, 'interior')) {
        addSurfaceMembers(members, createMember, wall, assembly, 'drywall', face);
    }
    if (assembly.trim.enabled) {
        for (const opening of wall.openings) {
            for (const face of getFinishFaces(assembly.trim.faces, wall, 'interior')) {
                addTrimMembers(members, createMember, wall, assembly, opening, face);
            }
        }
    }
    const quantities = buildQuantityLines(members, rulePack, {
        preserveWallScope: true,
    });
    const estimate = buildEstimate(quantities, rulePack.currency);
    return {
        wallId: wall.wallId,
        levelId: wall.levelId,
        assemblyId: assembly.id,
        wall,
        assembly,
        members,
        quantities,
        estimate,
        diagnostics,
        summary: {
            openingCount: wall.openings.length,
            memberCount: members.length,
            quantityCount: quantities.length,
            estimatedCost: estimate.summary.total,
        },
    };
}
