import type { DoorNode, DoorSegment, WindowNode } from '@pascal-app/core'

export type DoorStylePreset = {
  key: string
  label: string
  description: string
  getUpdates: (node: DoorNode) => Partial<DoorNode>
}

export type WindowStylePreset = {
  key: string
  label: string
  description: string
  getUpdates: (node: WindowNode) => Partial<WindowNode>
}

const panelSegment = (
  heightRatio: number,
  options?: Partial<
    Pick<DoorSegment, 'columnRatios' | 'dividerThickness' | 'panelDepth' | 'panelInset'>
  >,
): DoorSegment => ({
  type: 'panel',
  heightRatio,
  columnRatios: options?.columnRatios ?? [1],
  dividerThickness: options?.dividerThickness ?? 0.03,
  panelDepth: options?.panelDepth ?? 0.01,
  panelInset: options?.panelInset ?? 0.04,
})

const glassSegment = (
  heightRatio: number,
  options?: Partial<Pick<DoorSegment, 'columnRatios' | 'dividerThickness'>>,
): DoorSegment => ({
  type: 'glass',
  heightRatio,
  columnRatios: options?.columnRatios ?? [1],
  dividerThickness: options?.dividerThickness ?? 0.03,
  panelDepth: 0.01,
  panelInset: 0.04,
})

const keepDoorOnFloor = (node: DoorNode, height: number): DoorNode['position'] => [
  node.position[0],
  height / 2,
  node.position[2],
]

const keepWindowAboveFloor = (node: WindowNode, height: number): WindowNode['position'] => [
  node.position[0],
  Math.max(node.position[1], height / 2),
  node.position[2],
]

export const DOOR_STYLE_PRESETS: DoorStylePreset[] = [
  {
    key: 'standard',
    label: 'Standard',
    description: 'Single leaf with classic panels.',
    getUpdates: (node) => ({
      position: keepDoorOnFloor(node, 2.1),
      width: 0.9,
      height: 2.1,
      leafCount: 1,
      frameThickness: 0.05,
      frameDepth: 0.07,
      threshold: true,
      thresholdHeight: 0.02,
      contentPadding: [0.04, 0.04],
      handle: true,
      handleHeight: 1.05,
      handleSide: 'right',
      doorCloser: false,
      panicBar: false,
      panicBarHeight: 1.0,
      segments: [panelSegment(0.45), panelSegment(0.55)],
    }),
  },
  {
    key: 'half-lite',
    label: 'Half Lite',
    description: 'Glass upper half with a solid lower panel.',
    getUpdates: (node) => ({
      position: keepDoorOnFloor(node, 2.1),
      width: 0.95,
      height: 2.1,
      leafCount: 1,
      frameThickness: 0.05,
      frameDepth: 0.075,
      threshold: true,
      thresholdHeight: 0.02,
      contentPadding: [0.05, 0.05],
      handle: true,
      handleHeight: 1.03,
      handleSide: 'right',
      doorCloser: false,
      panicBar: false,
      panicBarHeight: 1.0,
      segments: [glassSegment(0.44), panelSegment(0.56)],
    }),
  },
  {
    key: 'full-lite',
    label: 'Full Lite',
    description: 'Large glazed door with minimal framing.',
    getUpdates: (node) => ({
      position: keepDoorOnFloor(node, 2.2),
      width: 1.0,
      height: 2.2,
      leafCount: 1,
      frameThickness: 0.05,
      frameDepth: 0.08,
      threshold: true,
      thresholdHeight: 0.02,
      contentPadding: [0.08, 0.08],
      handle: true,
      handleHeight: 1.02,
      handleSide: 'right',
      doorCloser: false,
      panicBar: false,
      panicBarHeight: 1.0,
      segments: [glassSegment(1)],
    }),
  },
  {
    key: 'french',
    label: 'French',
    description: 'Double leaf with divided glass lights.',
    getUpdates: (node) => ({
      position: keepDoorOnFloor(node, 2.2),
      width: 1.6,
      height: 2.2,
      leafCount: 2,
      frameThickness: 0.05,
      frameDepth: 0.08,
      threshold: true,
      thresholdHeight: 0.02,
      contentPadding: [0.06, 0.06],
      handle: true,
      handleHeight: 1.02,
      handleSide: 'right',
      doorCloser: false,
      panicBar: false,
      panicBarHeight: 1.0,
      segments: [
        glassSegment(0.34, { dividerThickness: 0.025 }),
        glassSegment(0.33, { dividerThickness: 0.025 }),
        glassSegment(0.33, { dividerThickness: 0.025 }),
      ],
    }),
  },
  {
    key: 'double-panel',
    label: 'Double Panel',
    description: 'Wider double door with solid panels.',
    getUpdates: (node) => ({
      position: keepDoorOnFloor(node, 2.1),
      width: 1.5,
      height: 2.1,
      leafCount: 2,
      frameThickness: 0.05,
      frameDepth: 0.075,
      threshold: true,
      thresholdHeight: 0.02,
      contentPadding: [0.05, 0.05],
      handle: true,
      handleHeight: 1.03,
      handleSide: 'right',
      doorCloser: false,
      panicBar: false,
      panicBarHeight: 1.0,
      segments: [panelSegment(0.42), panelSegment(0.58)],
    }),
  },
]

export const WINDOW_STYLE_PRESETS: WindowStylePreset[] = [
  {
    key: 'picture',
    label: 'Picture',
    description: 'Single large pane with a deeper sill.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 1.4),
      width: 1.8,
      height: 1.4,
      frameThickness: 0.06,
      frameDepth: 0.07,
      columnRatios: [1],
      rowRatios: [1],
      columnDividerThickness: 0.03,
      rowDividerThickness: 0.03,
      sill: true,
      sillDepth: 0.1,
      sillThickness: 0.03,
    }),
  },
  {
    key: 'double-hung',
    label: 'Double Hung',
    description: 'Traditional stacked sash split across two rows.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 1.6),
      width: 1.2,
      height: 1.6,
      frameThickness: 0.05,
      frameDepth: 0.07,
      columnRatios: [1],
      rowRatios: [1, 1],
      columnDividerThickness: 0.03,
      rowDividerThickness: 0.04,
      sill: true,
      sillDepth: 0.08,
      sillThickness: 0.03,
    }),
  },
  {
    key: 'casement',
    label: 'Casement',
    description: 'Side-by-side paired opening panels.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 1.5),
      width: 1.4,
      height: 1.5,
      frameThickness: 0.05,
      frameDepth: 0.07,
      columnRatios: [1, 1],
      rowRatios: [1],
      columnDividerThickness: 0.035,
      rowDividerThickness: 0.03,
      sill: true,
      sillDepth: 0.08,
      sillThickness: 0.03,
    }),
  },
  {
    key: 'six-lite',
    label: 'Six Lite',
    description: 'Grid window with evenly divided lights.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 1.3),
      width: 1.5,
      height: 1.3,
      frameThickness: 0.05,
      frameDepth: 0.07,
      columnRatios: [1, 1, 1],
      rowRatios: [1, 1],
      columnDividerThickness: 0.025,
      rowDividerThickness: 0.025,
      sill: true,
      sillDepth: 0.08,
      sillThickness: 0.03,
    }),
  },
  {
    key: 'french',
    label: 'French',
    description: 'Tall divided-light opening with no sill.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 2.1),
      width: 1.6,
      height: 2.1,
      frameThickness: 0.05,
      frameDepth: 0.08,
      columnRatios: [1, 1],
      rowRatios: [1, 1, 1],
      columnDividerThickness: 0.025,
      rowDividerThickness: 0.025,
      sill: false,
      sillDepth: 0.08,
      sillThickness: 0.03,
    }),
  },
  {
    key: 'transom',
    label: 'Transom',
    description: 'Shallow clerestory-style strip window.',
    getUpdates: (node) => ({
      position: keepWindowAboveFloor(node, 0.5),
      width: 1.6,
      height: 0.5,
      frameThickness: 0.045,
      frameDepth: 0.06,
      columnRatios: [1, 1, 1],
      rowRatios: [1],
      columnDividerThickness: 0.02,
      rowDividerThickness: 0.02,
      sill: false,
      sillDepth: 0.08,
      sillThickness: 0.03,
    }),
  },
]
