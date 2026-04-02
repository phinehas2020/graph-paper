import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS, getScaledDimensions, migrateSceneGraph, resolveLevelId, } from '@pascal-app/core/construction-interop';
const OPENING_EPSILON = 0.001;
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getWallLength(wall) {
    return Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
}
function getLevelNode(nodes, wall) {
    const parent = wall.parentId ? nodes[wall.parentId] : undefined;
    return parent?.type === 'level' ? parent : null;
}
function getBuildingAndSiteIds(nodes, levelId) {
    const buildingNode = levelId ? nodes[nodes[levelId]?.parentId ?? ''] : undefined;
    const buildingId = buildingNode?.type === 'building' ? buildingNode.id : null;
    const siteNode = buildingId ? nodes[nodes[buildingId]?.parentId ?? ''] : undefined;
    const siteId = siteNode?.type === 'site' ? siteNode.id : null;
    return { buildingId, siteId };
}
function getWallAssemblyId(wall, levelNode, assemblies, rulePack) {
    const wallAssemblyIds = new Set(assemblies.filter((assembly) => assembly.kind === 'wall').map((assembly) => assembly.id));
    const preferredId = wall.assemblyId ??
        levelNode?.defaultWallAssemblyId ??
        (wall.isExterior
            ? rulePack.defaults.exteriorWallAssemblyId
            : rulePack.defaults.interiorWallAssemblyId);
    return wallAssemblyIds.has(preferredId)
        ? preferredId
        : wall.isExterior
            ? rulePack.defaults.exteriorWallAssemblyId
            : rulePack.defaults.interiorWallAssemblyId;
}
function resolveOpeningVerticals(opening, type, rulePack) {
    const hasExplicitCenter = opening.position[1] > 0;
    if (hasExplicitCenter) {
        return {
            sillHeight: Math.max(0, opening.position[1] - opening.height / 2),
            headHeight: Math.max(opening.height, opening.position[1] + opening.height / 2),
            usedFallback: false,
        };
    }
    const fallbackSillHeight = type === 'door'
        ? rulePack.openingFallbacks.defaultDoorSillHeight
        : rulePack.openingFallbacks.defaultWindowSillHeight;
    return {
        sillHeight: fallbackSillHeight,
        headHeight: fallbackSillHeight + opening.height,
        usedFallback: true,
    };
}
function extractWallOpenings(wall, wallLength, wallHeight, nodes, rulePack, diagnostics) {
    const openings = [];
    for (const childId of wall.children) {
        const child = nodes[childId];
        if (!child) {
            diagnostics.push({
                id: `missing-wall-child:${wall.id}:${childId}`,
                level: 'warning',
                code: 'construction.wall.child_missing',
                message: `Wall ${wall.id} references missing child ${childId}.`,
                sourceNodeId: wall.id,
                wallId: wall.id,
            });
            continue;
        }
        if (child.type === 'item') {
            const item = child;
            if (item.asset.attachTo !== 'wall' && item.asset.attachTo !== 'wall-side') {
                diagnostics.push({
                    id: `wall-child-not-opening:${wall.id}:${child.id}`,
                    level: 'info',
                    code: 'construction.wall.child_not_opening',
                    message: `Wall child ${child.id} is not compiled as a framed opening in this pass.`,
                    sourceNodeId: child.id,
                    wallId: wall.id,
                });
                continue;
            }
            const [itemWidth, itemHeight] = getScaledDimensions(item);
            const minCenter = itemWidth / 2;
            const maxCenter = Math.max(minCenter, wallLength - itemWidth / 2);
            const centerOffset = clamp(item.position[0], minCenter, maxCenter);
            const sillHeight = clamp(item.position[1], 0, wallHeight);
            const headHeight = clamp(item.position[1] + itemHeight, 0, wallHeight);
            openings.push({
                openingId: item.id,
                wallId: wall.id,
                sourceNodeId: item.id,
                type: 'item',
                centerOffset,
                width: itemWidth,
                height: Math.max(0, headHeight - sillHeight),
                sillHeight,
                headHeight,
            });
            continue;
        }
        if (child.type !== 'door' && child.type !== 'window') {
            diagnostics.push({
                id: `wall-child-not-opening:${wall.id}:${child.id}`,
                level: 'info',
                code: 'construction.wall.child_not_opening',
                message: `Wall child ${child.id} is not compiled as a framed opening in this pass.`,
                sourceNodeId: child.id,
                wallId: wall.id,
            });
            continue;
        }
        const type = child.type;
        const opening = child.type === 'door' ? child : child;
        const minCenter = opening.width / 2;
        const maxCenter = Math.max(minCenter, wallLength - opening.width / 2);
        const centerOffset = clamp(opening.position[0], minCenter, maxCenter);
        const verticals = resolveOpeningVerticals(opening, type, rulePack);
        const sillHeight = clamp(verticals.sillHeight, 0, wallHeight);
        const headHeight = clamp(verticals.headHeight, 0, wallHeight);
        if (verticals.usedFallback) {
            diagnostics.push({
                id: `opening-height-fallback:${opening.id}`,
                level: 'info',
                code: 'construction.opening.height_fallback',
                message: `Opening ${opening.id} used a baseline sill-height fallback because its authored center height was unset.`,
                sourceNodeId: opening.id,
                wallId: wall.id,
                openingId: opening.id,
            });
        }
        if (Math.abs(centerOffset - opening.position[0]) > OPENING_EPSILON) {
            diagnostics.push({
                id: `opening-clamped:${opening.id}`,
                level: 'warning',
                code: 'construction.opening.clamped_to_wall',
                message: `Opening ${opening.id} extends beyond wall ${wall.id} and was clamped for takeoff.`,
                sourceNodeId: opening.id,
                wallId: wall.id,
                openingId: opening.id,
            });
        }
        openings.push({
            openingId: opening.id,
            wallId: wall.id,
            sourceNodeId: opening.id,
            type,
            centerOffset,
            width: opening.width,
            height: Math.max(0, headHeight - sillHeight),
            sillHeight,
            headHeight,
        });
    }
    openings.sort((left, right) => left.centerOffset - right.centerOffset);
    for (let index = 1; index < openings.length; index += 1) {
        const previous = openings[index - 1];
        const current = openings[index];
        const previousRight = previous.centerOffset + previous.width / 2;
        const currentLeft = current.centerOffset - current.width / 2;
        if (currentLeft < previousRight - OPENING_EPSILON) {
            diagnostics.push({
                id: `opening-overlap:${previous.openingId}:${current.openingId}`,
                level: 'warning',
                code: 'construction.opening.overlap',
                message: `Openings ${previous.openingId} and ${current.openingId} overlap on wall ${wall.id}.`,
                sourceNodeId: wall.id,
                wallId: wall.id,
            });
        }
    }
    return openings;
}
export function buildConstructionTopology(sceneInput, assemblies, rulePack) {
    const scene = migrateSceneGraph(sceneInput);
    const nodes = scene.nodes;
    const diagnostics = [];
    const siteIds = Object.values(nodes)
        .filter((node) => node.type === 'site')
        .map((node) => node.id);
    const buildingIds = Object.values(nodes)
        .filter((node) => node.type === 'building')
        .map((node) => node.id);
    const levelIds = Object.values(nodes)
        .filter((node) => node.type === 'level')
        .map((node) => node.id);
    const walls = Object.values(nodes)
        .filter((node) => node.type === 'wall')
        .map((wall) => {
        const levelNode = getLevelNode(nodes, wall);
        const { buildingId, siteId } = getBuildingAndSiteIds(nodes, levelNode?.id ?? null);
        const length = getWallLength(wall);
        const height = wall.height ?? DEFAULT_WALL_HEIGHT;
        const thickness = wall.thickness ?? DEFAULT_WALL_THICKNESS;
        const assemblyId = getWallAssemblyId(wall, levelNode, assemblies, rulePack);
        if (length <= OPENING_EPSILON) {
            diagnostics.push({
                id: `wall-zero-length:${wall.id}`,
                level: 'warning',
                code: 'construction.wall.zero_length',
                message: `Wall ${wall.id} has near-zero length and will not generate meaningful framing.`,
                sourceNodeId: wall.id,
                wallId: wall.id,
            });
        }
        const openings = extractWallOpenings(wall, length, height, nodes, rulePack, diagnostics);
        return {
            wallId: wall.id,
            levelId: levelNode?.id ?? null,
            buildingId,
            siteId,
            assemblyId,
            isExterior: wall.isExterior || wall.frontSide === 'exterior' || wall.backSide === 'exterior',
            isBearing: wall.isBearing,
            start: wall.start,
            end: wall.end,
            length,
            height,
            thickness,
            openings,
        };
    });
    Object.values(nodes)
        .filter((node) => node.type === 'roof-segment')
        .forEach((segment) => {
        if (segment.wallHeight > 0 || segment.wallThickness > 0) {
            diagnostics.push({
                id: `roof-segment-preview-wall:${segment.id}`,
                level: 'info',
                code: 'construction.roof.preview_walls_ignored',
                message: `Roof segment ${segment.id} still carries preview wall dimensions. The construction compiler ignores those pseudo-walls.`,
                sourceNodeId: segment.id,
            });
        }
    });
    const topology = {
        siteIds,
        buildingIds,
        levelIds,
        wallIds: walls.map((wall) => wall.wallId),
        openingIds: walls.flatMap((wall) => wall.openings.map((opening) => opening.openingId)),
        walls,
    };
    const rooms = Object.values(nodes)
        .filter((node) => node.type === 'zone')
        .map((zone) => ({
        zoneId: zone.id,
        name: zone.name,
        roomType: zone.roomType,
        fixtureProfile: zone.fixtureProfile ?? null,
        levelId: resolveLevelId(zone, nodes) ?? null,
    }));
    return { scene, nodes, topology, diagnostics, rooms };
}
export const buildSceneTopology = buildConstructionTopology;
export const extractTopology = buildConstructionTopology;
