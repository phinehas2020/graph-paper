// Base
export { BaseNode, generateId, nodeType, objectId } from './base'
// Camera
export { CameraSchema } from './camera'
// Collections
export { type Collection, type CollectionId, generateCollectionId } from './collections'
// Construction
export {
  ConstructionManualOverridesSchema,
  FixtureProfile,
  FloorJoistSystem,
  type FloorJoistSystem as FloorJoistSystemValue,
  FloorMemberStock,
  type FloorMemberStock as FloorMemberStockValue,
  FloorFramingStrategy,
  type FixtureProfile as FixtureProfileValue,
  type FloorFramingStrategy as FloorFramingStrategyValue,
  type FloorSupportLine as FloorSupportLineValue,
  FloorSupportLineAxis,
  type FloorSupportLineAxis as FloorSupportLineAxisValue,
  FloorSupportLineKind,
  type FloorSupportLineKind as FloorSupportLineKindValue,
  FloorSupportLineSchema,
  type JoistDirection as JoistDirectionValue,
  JoistDirection,
  LevelFramingStrategy,
  type LevelFramingStrategy as LevelFramingStrategyValue,
  RoofFramingStrategy,
  type RoofFramingStrategy as RoofFramingStrategyValue,
  RoomType,
  type RoomType as RoomTypeValue,
  WallFramingStrategy,
  type WallFramingStrategy as WallFramingStrategyValue,
} from './construction'
export {
  createDefaultSceneGraph,
  createSceneGraphSnapshot,
  isSceneGraph,
  migrateSceneGraph,
  SCENE_SCHEMA_VERSION,
} from './scene-graph'
export type { NormalizedSceneGraph, SceneGraph } from './scene-graph'
// Material
export {
  DEFAULT_MATERIALS,
  MaterialPreset,
  MaterialProperties,
  MaterialSchema,
  resolveMaterial,
} from './material'
export { BuildingNode } from './nodes/building'
export { CeilingNode } from './nodes/ceiling'
export { DoorNode, DoorSegment } from './nodes/door'
export { GuideNode } from './nodes/guide'
export type {
  AnimationEffect,
  Asset,
  AssetInput,
  Control,
  Effect,
  Interactive,
  LightEffect,
  SliderControl,
  TemperatureControl,
  ToggleControl,
} from './nodes/item'
export { getScaledDimensions, ItemNode } from './nodes/item'
export { LevelNode } from './nodes/level'
export { RoofNode } from './nodes/roof'
export { RoofSegmentNode, RoofType } from './nodes/roof-segment'
export { ScanNode } from './nodes/scan'
// Nodes
export { SiteNode } from './nodes/site'
export { SlabNode } from './nodes/slab'
export { WallNode } from './nodes/wall'
export { WindowNode } from './nodes/window'
export { ZoneNode } from './nodes/zone'
export type { AnyNodeId, AnyNodeType } from './types'
// Union types
export { AnyNode } from './types'
