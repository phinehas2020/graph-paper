export type QuantityUnit = 'ea' | 'lf' | 'sf' | 'sheet' | 'cf'

export type AssemblyKind = 'wall' | 'floor' | 'roof' | 'finish' | 'mep'

export type LumberSpec = {
  nominal: string
  actualThickness: number
  actualDepth: number
  materialCode: string
}

export type SheetGoodsSpec = {
  materialCode: string
  thickness: number
  sheetWidth: number
  sheetHeight: number
  faces: number
}

export type TrimSpec = {
  enabled: boolean
  faces: number
  casingWidth: number
  thickness: number
  materialCode: string
}

export type OpeningFramingSpec = {
  kingStudsPerSide: number
  jackStudsPerSide: number
  headerBearingLength: number
  crippleSpacing?: number
  sillMemberCount: number
}

export type WallAssemblyDefinition = {
  id: string
  kind: 'wall'
  name: string
  description: string
  isExterior: boolean
  studSpacing: number
  topPlateCount: number
  bottomPlateCount: number
  stud: LumberSpec
  plate: LumberSpec
  header: LumberSpec
  blocking: LumberSpec
  defaultHeight?: number
  defaultThickness?: number
  sheathing: SheetGoodsSpec
  drywall: SheetGoodsSpec
  trim: TrimSpec
  openingFraming: OpeningFramingSpec
  uniformatCode: string
  masterformatCode: string
}

export type GenericAssemblyDefinition = {
  id: string
  kind: Exclude<AssemblyKind, 'wall'>
  name: string
  description: string
  uniformatCode: string
  masterformatCode: string
}

export type FloorAssemblyDefinition = GenericAssemblyDefinition & {
  kind: 'floor'
}

export type RoofAssemblyDefinition = GenericAssemblyDefinition & {
  kind: 'roof'
}

export type FinishAssemblyDefinition = GenericAssemblyDefinition & {
  kind: 'finish'
}

export type MepAssemblyDefinition = GenericAssemblyDefinition & {
  kind: 'mep'
}

export type AssemblyDefinition =
  | WallAssemblyDefinition
  | FloorAssemblyDefinition
  | RoofAssemblyDefinition
  | FinishAssemblyDefinition
  | MepAssemblyDefinition

export type AssemblyCatalog = Record<string, AssemblyDefinition>
