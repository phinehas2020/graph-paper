export { migrateSceneGraph } from './schema/scene-graph';
export { getScaledDimensions } from './schema/nodes/item';
export { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from './systems/wall/wall-footprint';
export function resolveLevelId(node, nodes) {
    if (node.type === 'level') {
        return node.id;
    }
    let current = node;
    while (current) {
        if (current.type === 'level') {
            return current.id;
        }
        current = current.parentId ? nodes[current.parentId] : undefined;
    }
    return 'default';
}
