import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS, getScaledDimensions, migrateSceneGraph, resolveLevelId, } from '@pascal-app/core/construction-interop';
import { lineLength, pathLength, polygonArea, polygonPerimeter } from '../shared';
const OPENING_EPSILON = 0.001;
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getWallLength(wall) {
    return Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
}
function getLevelNode(nodes, node) {
    if (node.type === 'level') {
        return node;
    }
    const levelId = resolveLevelId(node, nodes);
    const level = levelId ? nodes[levelId] : undefined;
    return level?.type === 'level' ? level : null;
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
    const levelDefaultWallAssemblyId = levelNode?.defaultWallAssemblyId;
    const preferredId = wall.assemblyId ??
        levelDefaultWallAssemblyId ??
        (wall.isExterior
            ? rulePack.defaults.exteriorWallAssemblyId
            : rulePack.defaults.interiorWallAssemblyId);
    return wallAssemblyIds.has(preferredId)
        ? preferredId
        : wall.isExterior
            ? rulePack.defaults.exteriorWallAssemblyId
            : rulePack.defaults.interiorWallAssemblyId;
}
function buildTopologyBase(node, nodes, assemblyId) {
    const levelNode = getLevelNode(nodes, node);
    const { buildingId, siteId } = getBuildingAndSiteIds(nodes, levelNode?.id ?? null);
    return {
        sourceNodeId: node.id,
        levelId: levelNode?.id ?? null,
        buildingId,
        siteId,
        assemblyId,
    };
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
        const opening = child.type === 'door' ? child : child;
        const minCenter = opening.width / 2;
        const maxCenter = Math.max(minCenter, wallLength - opening.width / 2);
        const centerOffset = clamp(opening.position[0], minCenter, maxCenter);
        const verticals = resolveOpeningVerticals(opening, child.type, rulePack);
        const sillHeight = clamp(verticals.sillHeight, 0, wallHeight);
        const headHeight = clamp(verticals.headHeight, 0, wallHeight);
        openings.push({
            openingId: opening.id,
            wallId: wall.id,
            sourceNodeId: opening.id,
            type: child.type,
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
        const openings = extractWallOpenings(wall, length, height, nodes, rulePack, diagnostics);
        return {
            sourceNodeId: wall.id,
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
    const floorSystems = Object.values(nodes)
        .filter((node) => node.type === 'floor-system')
        .map((node) => {
        const base = buildTopologyBase(node, nodes, node.assemblyId ?? rulePack.defaults.floorAssemblyId);
        return {
            ...base,
            floorSystemId: node.id,
            polygon: node.polygon,
            area: polygonArea(node.polygon),
            perimeter: polygonPerimeter(node.polygon),
            derivedFromSlabId: node.derivedFromSlabId,
            framingKind: node.framingKind,
            joistAngle: node.joistAngle,
            joistSpacing: node.joistSpacing,
            memberDepth: node.memberDepth,
            rimMode: node.rimMode,
            elevation: node.elevation,
            sheathingThickness: node.sheathingThickness,
            openingIds: node.children.filter((childId) => nodes[childId]?.type === 'floor-opening'),
            blockingIds: node.children.filter((childId) => nodes[childId]?.type === 'blocking-run'),
        };
    });
    const floorOpenings = Object.values(nodes)
        .filter((node) => node.type === 'floor-opening')
        .map((node) => {
        const base = buildTopologyBase(node, nodes, rulePack.defaults.floorAssemblyId);
        return {
            ...base,
            floorOpeningId: node.id,
            parentFloorSystemId: node.parentId && nodes[node.parentId]?.type === 'floor-system' ? node.parentId : null,
            polygon: node.polygon,
            area: polygonArea(node.polygon),
            perimeter: polygonPerimeter(node.polygon),
            curbHeight: node.curbHeight,
        };
    });
    const blockingRuns = Object.values(nodes)
        .filter((node) => node.type === 'blocking-run')
        .map((node) => {
        const base = buildTopologyBase(node, nodes, rulePack.defaults.floorAssemblyId);
        return {
            ...base,
            blockingRunId: node.id,
            parentFloorSystemId: node.parentId && nodes[node.parentId]?.type === 'floor-system' ? node.parentId : null,
            start: node.start,
            end: node.end,
            length: lineLength(node.start, node.end),
            kind: node.kind,
            spacing: node.spacing,
            materialCode: node.materialCode,
        };
    });
    const beamLines = Object.values(nodes)
        .filter((node) => node.type === 'beam-line')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.floorAssemblyId),
        beamLineId: node.id,
        supportFloorSystemId: node.supportFloorSystemId,
        start: node.start,
        end: node.end,
        length: lineLength(node.start, node.end),
        width: node.width,
        depth: node.depth,
        materialCode: node.materialCode,
    }));
    const supportPosts = Object.values(nodes)
        .filter((node) => node.type === 'support-post')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.floorAssemblyId),
        supportPostId: node.id,
        center: node.center,
        width: node.width,
        depth: node.depth,
        height: node.height,
        materialCode: node.materialCode,
    }));
    const roofPlanes = Object.values(nodes)
        .filter((node) => node.type === 'roof-plane')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, node.assemblyId ?? rulePack.defaults.roofAssemblyId),
        roofPlaneId: node.id,
        polygon: node.polygon,
        area: polygonArea(node.polygon),
        perimeter: polygonPerimeter(node.polygon),
        pitch: node.pitch,
        overhang: node.overhang,
        plateHeight: node.plateHeight,
        heelHeight: node.heelHeight,
        sheathingThickness: node.sheathingThickness,
        roofingThickness: node.roofingThickness,
        framingMode: node.framingMode,
        trussArrayIds: node.children.filter((childId) => nodes[childId]?.type === 'truss-array'),
        rafterSetIds: node.children.filter((childId) => nodes[childId]?.type === 'rafter-set'),
    }));
    const trussArrays = Object.values(nodes)
        .filter((node) => node.type === 'truss-array')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, node.assemblyId ?? rulePack.defaults.roofAssemblyId),
        trussArrayId: node.id,
        roofPlaneId: node.roofPlaneId ?? (node.parentId && nodes[node.parentId]?.type === 'roof-plane' ? node.parentId : null),
        start: node.start,
        end: node.end,
        length: lineLength(node.start, node.end),
        spacing: node.spacing,
        heelHeight: node.heelHeight,
        overhang: node.overhang,
    }));
    const rafterSets = Object.values(nodes)
        .filter((node) => node.type === 'rafter-set')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, node.assemblyId ?? rulePack.defaults.roofAssemblyId),
        rafterSetId: node.id,
        roofPlaneId: node.roofPlaneId ?? (node.parentId && nodes[node.parentId]?.type === 'roof-plane' ? node.parentId : null),
        start: node.start,
        end: node.end,
        length: lineLength(node.start, node.end),
        spacing: node.spacing,
        ridgeBoardDepth: node.ridgeBoardDepth,
        overhang: node.overhang,
    }));
    const electricalPanels = Object.values(nodes)
        .filter((node) => node.type === 'electrical-panel')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        electricalPanelId: node.id,
        position: node.position,
        amperage: node.amperage,
        voltage: node.voltage,
        mainBreakerAmps: node.mainBreakerAmps,
        circuitIds: node.children.filter((childId) => nodes[childId]?.type === 'circuit'),
    }));
    const circuits = Object.values(nodes)
        .filter((node) => node.type === 'circuit')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        circuitId: node.id,
        panelId: node.parentId && nodes[node.parentId]?.type === 'electrical-panel' ? node.parentId : null,
        label: node.label,
        breakerAmps: node.breakerAmps,
        voltage: node.voltage,
        circuitType: node.circuitType,
        runIds: node.children.filter((childId) => {
            const child = nodes[childId];
            return child?.type === 'wire-run' || child?.type === 'switch-leg';
        }),
    }));
    const deviceBoxes = Object.values(nodes)
        .filter((node) => node.type === 'device-box')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        deviceBoxId: node.id,
        position: node.position,
        deviceType: node.deviceType,
        wallId: node.wallId,
        circuitId: node.circuitId,
        mountHeight: node.mountHeight,
        voltage: node.voltage,
        wireType: node.wireType,
    }));
    const lightFixtures = Object.values(nodes)
        .filter((node) => node.type === 'light-fixture')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        lightFixtureId: node.id,
        position: node.position,
        fixtureType: node.fixtureType,
        circuitId: node.circuitId,
        mountHeight: node.mountHeight,
    }));
    const wireRuns = Object.values(nodes)
        .filter((node) => node.type === 'wire-run')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        wireRunId: node.id,
        circuitId: node.circuitId,
        path: node.path,
        length: pathLength(node.path),
        wireType: node.wireType,
        homerun: node.homerun,
        pathMode: node.pathMode,
    }));
    const switchLegs = Object.values(nodes)
        .filter((node) => node.type === 'switch-leg')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        switchLegId: node.id,
        circuitId: node.circuitId,
        path: node.path,
        length: pathLength(node.path),
        wireType: node.wireType,
    }));
    const plumbingFixtures = Object.values(nodes)
        .filter((node) => node.type === 'plumbing-fixture')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        plumbingFixtureId: node.id,
        position: node.position,
        fixtureType: node.fixtureType,
        roomType: node.roomType,
        pipeMaterial: node.pipeMaterial,
        drainDiameter: node.drainDiameter,
    }));
    const supplyRuns = Object.values(nodes)
        .filter((node) => node.type === 'supply-run')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        supplyRunId: node.id,
        path: node.path,
        length: pathLength(node.path),
        systemKind: node.systemKind,
        pipeMaterial: node.pipeMaterial,
        diameter: node.diameter,
    }));
    const drainRuns = Object.values(nodes)
        .filter((node) => node.type === 'drain-run')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        drainRunId: node.id,
        path: node.path,
        length: pathLength(node.path),
        pipeMaterial: node.pipeMaterial,
        diameter: node.diameter,
        slope: node.slope,
    }));
    const ventRuns = Object.values(nodes)
        .filter((node) => node.type === 'vent-run')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, rulePack.defaults.mepAssemblyId),
        ventRunId: node.id,
        path: node.path,
        length: pathLength(node.path),
        pipeMaterial: node.pipeMaterial,
        diameter: node.diameter,
    }));
    const foundationSystems = Object.values(nodes)
        .filter((node) => node.type === 'foundation-system')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, 'foundation-generic'),
        foundationSystemId: node.id,
        foundationKind: node.foundationKind,
        footingWidth: node.footingWidth,
        footingDepth: node.footingDepth,
        stemWallThickness: node.stemWallThickness,
        rebarProfile: node.rebarProfile,
        childIds: node.children,
    }));
    const footingRuns = Object.values(nodes)
        .filter((node) => node.type === 'footing-run')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, 'foundation-generic'),
        footingRunId: node.id,
        parentFoundationSystemId: node.parentId && nodes[node.parentId]?.type === 'foundation-system' ? node.parentId : null,
        start: node.start,
        end: node.end,
        length: lineLength(node.start, node.end),
        width: node.width,
        depth: node.depth,
        thickness: node.thickness,
    }));
    const stemWalls = Object.values(nodes)
        .filter((node) => node.type === 'stem-wall')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, 'foundation-generic'),
        stemWallId: node.id,
        parentFoundationSystemId: node.parentId && nodes[node.parentId]?.type === 'foundation-system' ? node.parentId : null,
        start: node.start,
        end: node.end,
        length: lineLength(node.start, node.end),
        thickness: node.thickness,
        height: node.height,
    }));
    const piers = Object.values(nodes)
        .filter((node) => node.type === 'pier')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, 'foundation-generic'),
        pierId: node.id,
        parentFoundationSystemId: node.parentId && nodes[node.parentId]?.type === 'foundation-system' ? node.parentId : null,
        center: node.center,
        width: node.width,
        depth: node.depth,
        height: node.height,
    }));
    const columns = Object.values(nodes)
        .filter((node) => node.type === 'column')
        .map((node) => ({
        ...buildTopologyBase(node, nodes, 'foundation-generic'),
        columnId: node.id,
        parentFoundationSystemId: node.parentId && nodes[node.parentId]?.type === 'foundation-system' ? node.parentId : null,
        center: node.center,
        width: node.width,
        depth: node.depth,
        height: node.height,
        materialCode: node.materialCode,
    }));
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
        floorSystemIds: floorSystems.map((entry) => entry.floorSystemId),
        floorOpeningIds: floorOpenings.map((entry) => entry.floorOpeningId),
        blockingRunIds: blockingRuns.map((entry) => entry.blockingRunId),
        beamLineIds: beamLines.map((entry) => entry.beamLineId),
        supportPostIds: supportPosts.map((entry) => entry.supportPostId),
        roofPlaneIds: roofPlanes.map((entry) => entry.roofPlaneId),
        trussArrayIds: trussArrays.map((entry) => entry.trussArrayId),
        rafterSetIds: rafterSets.map((entry) => entry.rafterSetId),
        electricalPanelIds: electricalPanels.map((entry) => entry.electricalPanelId),
        circuitIds: circuits.map((entry) => entry.circuitId),
        deviceBoxIds: deviceBoxes.map((entry) => entry.deviceBoxId),
        lightFixtureIds: lightFixtures.map((entry) => entry.lightFixtureId),
        wireRunIds: wireRuns.map((entry) => entry.wireRunId),
        switchLegIds: switchLegs.map((entry) => entry.switchLegId),
        plumbingFixtureIds: plumbingFixtures.map((entry) => entry.plumbingFixtureId),
        supplyRunIds: supplyRuns.map((entry) => entry.supplyRunId),
        drainRunIds: drainRuns.map((entry) => entry.drainRunId),
        ventRunIds: ventRuns.map((entry) => entry.ventRunId),
        foundationSystemIds: foundationSystems.map((entry) => entry.foundationSystemId),
        footingRunIds: footingRuns.map((entry) => entry.footingRunId),
        stemWallIds: stemWalls.map((entry) => entry.stemWallId),
        pierIds: piers.map((entry) => entry.pierId),
        columnIds: columns.map((entry) => entry.columnId),
        walls,
        floorSystems,
        floorOpenings,
        blockingRuns,
        beamLines,
        supportPosts,
        roofPlanes,
        trussArrays,
        rafterSets,
        electricalPanels,
        circuits,
        deviceBoxes,
        lightFixtures,
        wireRuns,
        switchLegs,
        plumbingFixtures,
        supplyRuns,
        drainRuns,
        ventRuns,
        foundationSystems,
        footingRuns,
        stemWalls,
        piers,
        columns,
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
