import type { AssemblyDefinition, QuantityUnit, WallAssemblyDefinition } from './assemblies'
import type { ConstructionDiagnostic } from './diagnostics'
import type { ConstructionEstimate } from './estimate'
import type { QuantityLine } from './quantities'

export type ConstructionWorkspace = 'design' | 'framing' | 'systems' | 'estimate' | 'reports'

export const DEFAULT_CONSTRUCTION_WORKSPACE: ConstructionWorkspace = 'framing'

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export type ConstructionWallFace = 'interior' | 'exterior' | 'center'

export type WallOpening = {
  openingId: string
  wallId: string
  sourceNodeId: string
  type: 'door' | 'window' | 'item'
  centerOffset: number
  width: number
  height: number
  sillHeight: number
  headHeight: number
}

export type SystemsSummaryRoom = {
  zoneId: string
  name: string
  roomType: string
  fixtureProfile: string | null
  levelId: string | null
}

export type ConstructionTopologyWall = {
  wallId: string
  levelId: string | null
  buildingId: string | null
  siteId: string | null
  assemblyId: string
  isExterior: boolean
  isBearing: boolean
  start: Vec2
  end: Vec2
  length: number
  height: number
  thickness: number
  openings: WallOpening[]
}

export type ConstructionTopologyFloorSupportLine = {
  id: string
  axis: 'x' | 'z'
  kind: 'beam' | 'bearing-line'
  offset: number
  stock: '2x8' | '2x10'
}

export type ConstructionTopologyFloor = {
  floorId: string
  levelId: string | null
  buildingId: string | null
  siteId: string | null
  assemblyId: string
  polygon: Vec2[]
  holes: Vec2[][]
  elevation: number
  netArea: number
  framingStrategy: 'slab-on-grade' | 'joists' | 'engineered'
  joistDirection: 'x' | 'z' | 'auto'
  joistSystem: 'dimensional-lumber' | 'i-joist' | 'open-web'
  joistSpacing: number
  joistStock: '2x8' | '2x10'
  beamStock: '2x8' | '2x10'
  stockLength: number
  supportLines: ConstructionTopologyFloorSupportLine[]
}

export type ConstructionTopology = {
  siteIds: string[]
  buildingIds: string[]
  levelIds: string[]
  wallIds: string[]
  floorIds: string[]
  openingIds: string[]
  walls: ConstructionTopologyWall[]
  floors: ConstructionTopologyFloor[]
}

export type ConstructionMemberType =
  | 'plate'
  | 'stud'
  | 'king-stud'
  | 'jack-stud'
  | 'header'
  | 'cripple-stud'
  | 'blocking'
  | 'sheathing'
  | 'drywall'
  | 'trim'
  | 'joist'
  | 'rim-board'
  | 'beam'
  | 'subfloor-panel'

export type ConstructionMemberCategory = 'framing' | 'envelope' | 'finish'

export type ConstructionMemberGeometry = {
  kind: 'box'
  face: ConstructionWallFace
  localCenter: Vec3
  localSize: Vec3
  localStart?: Vec3
  localEnd?: Vec3
}

export type ConstructionMember = {
  id: string
  wallId: string
  levelId: string | null
  sourceNodeId: string
  assemblyId: string
  type: ConstructionMemberType
  category: ConstructionMemberCategory
  label: string
  materialCode: string
  unit: QuantityUnit
  quantity: number
  count: number
  geometry: ConstructionMemberGeometry
  start?: Vec3
  end?: Vec3
  metadata?: Record<string, unknown>
}

export type ConstructionPassResult = {
  members: ConstructionMember[]
  quantities: QuantityLine[]
  estimate: ConstructionEstimate
  diagnostics: ConstructionDiagnostic[]
}

export type WallCompileSummary = {
  openingCount: number
  memberCount: number
  quantityCount: number
  estimatedCost: number
}

export type WallCompileResult = ConstructionPassResult & {
  wallId: string
  levelId: string | null
  assemblyId: string
  wall: ConstructionTopologyWall
  assembly: WallAssemblyDefinition
  summary: WallCompileSummary
}

export type WallFramingResult = WallCompileResult

export type FloorCompileSummary = {
  supportLineCount: number
  openingCount: number
  joistCount: number
  memberCount: number
  quantityCount: number
  estimatedCost: number
}

export type FloorCompileResult = ConstructionPassResult & {
  floorId: string
  levelId: string | null
  assemblyId: string
  floor: ConstructionTopologyFloor
  summary: FloorCompileSummary
}

export type ConstructionCompileSummary = {
  wallCount: number
  floorCount: number
  openingCount: number
  memberCount: number
  quantityCount: number
  totalEstimatedCost: number
}

export type ConstructionCompileResult = ConstructionPassResult & {
  sceneSchemaVersion: number
  compilerVersion: string
  rulePackId: string
  generatedAt: string
  assemblies: AssemblyDefinition[]
  topology: ConstructionTopology
  wallResults: WallCompileResult[]
  floorResults: FloorCompileResult[]
  wallsById: Record<string, WallCompileResult>
  floorsById: Record<string, FloorCompileResult>
  rooms: SystemsSummaryRoom[]
  summary: ConstructionCompileSummary
}

export type ConstructionGraph = ConstructionCompileResult
