import { type AnyNode as AnyNodeType, type AnyNodeId } from './types';
export declare const SCENE_SCHEMA_VERSION = 2;
export type SceneGraph = {
    sceneSchemaVersion?: number;
    version?: number;
    nodes: Record<string, unknown>;
    rootNodeIds: string[];
};
export type NormalizedSceneGraph = {
    sceneSchemaVersion: number;
    nodes: Record<AnyNodeId, AnyNodeType>;
    rootNodeIds: AnyNodeId[];
};
export declare function isSceneGraph(value: unknown): value is SceneGraph;
export declare function createDefaultSceneGraph(): NormalizedSceneGraph;
export declare function createSceneGraphSnapshot(nodes: Record<AnyNodeId, AnyNodeType>, rootNodeIds: AnyNodeId[], sceneSchemaVersion?: number): NormalizedSceneGraph;
export declare function migrateSceneGraph(sceneGraph: SceneGraph | null | undefined): NormalizedSceneGraph;
//# sourceMappingURL=scene-graph.d.ts.map