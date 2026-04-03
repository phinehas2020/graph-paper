import {
  CircuitNode,
  DeviceBoxNode,
  ElectricalPanelNode,
  LightFixtureNode,
  SwitchLegNode,
  WireRunNode,
  type AnyNodeId,
  resolveLevelId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { PointDrawTool } from '../shared/point-draw-tool'
import { PolylineDrawTool } from '../shared/polyline-draw-tool'

function ensureCircuit(levelId: string) {
  const { nodes, createNode } = useScene.getState()
  const selectedIds = useViewer.getState().selection.selectedIds
  const selectedCircuit = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .find((node) => node?.type === 'circuit')

  if (selectedCircuit?.type === 'circuit') {
    return selectedCircuit
  }

  const existingCircuit = Object.values(nodes).find(
    (node) => node?.type === 'circuit' && resolveLevelId(node, nodes) === levelId,
  )
  if (existingCircuit?.type === 'circuit') {
    return existingCircuit
  }

  const existingPanel = Object.values(nodes).find(
    (node) => node?.type === 'electrical-panel' && resolveLevelId(node, nodes) === levelId,
  )

  const panel =
    existingPanel?.type === 'electrical-panel'
      ? existingPanel
      : ElectricalPanelNode.parse({
          name: 'Main Panel',
          position: [0, 1.8, 0],
        })

  if (!(existingPanel && existingPanel.type === 'electrical-panel')) {
    createNode(panel, levelId as AnyNodeId)
  }

  const circuitCount = Object.values(nodes).filter((node) => node?.type === 'circuit').length
  const circuit = CircuitNode.parse({
    name: `Circuit ${circuitCount + 1}`,
    label: `Circuit ${circuitCount + 1}`,
  })
  createNode(circuit, panel.id as AnyNodeId)
  return circuit
}

export const ElectricalTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId) return null

  if (constructionTool === 'electrical-panel') {
    return (
      <PointDrawTool
        color="#334155"
        onCommit={(position) => {
          const panel = ElectricalPanelNode.parse({
            name: 'Main Panel',
            position,
          })
          createNode(panel, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [panel.id] })
        }}
      />
    )
  }

  if (constructionTool === 'device-box') {
    return (
      <PointDrawTool
        color="#0f766e"
        onCommit={(position) => {
          const circuit = ensureCircuit(currentLevelId)
          const device = DeviceBoxNode.parse({
            name: 'Device Box',
            circuitId: circuit.id,
            position: [position[0], 0.4572, position[2]],
          })
          createNode(device, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [device.id] })
        }}
      />
    )
  }

  if (constructionTool === 'light-fixture') {
    return (
      <PointDrawTool
        color="#facc15"
        onCommit={(position) => {
          const circuit = ensureCircuit(currentLevelId)
          const fixture = LightFixtureNode.parse({
            name: 'Light Fixture',
            circuitId: circuit.id,
            position: [position[0], 2.4384, position[2]],
          })
          createNode(fixture, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [fixture.id] })
        }}
      />
    )
  }

  if (constructionTool === 'wire-run') {
    return (
      <PolylineDrawTool
        color="#38bdf8"
        onCommit={(path) => {
          const circuit = ensureCircuit(currentLevelId)
          const run = WireRunNode.parse({
            name: 'Wire Run',
            circuitId: circuit.id,
            path,
          })
          createNode(run, circuit.id as AnyNodeId)
          setSelection({ selectedIds: [run.id] })
        }}
      />
    )
  }

  if (constructionTool === 'switch-leg') {
    return (
      <PolylineDrawTool
        color="#f97316"
        onCommit={(path) => {
          const circuit = ensureCircuit(currentLevelId)
          const switchLeg = SwitchLegNode.parse({
            name: 'Switch Leg',
            circuitId: circuit.id,
            path,
          })
          createNode(switchLeg, circuit.id as AnyNodeId)
          setSelection({ selectedIds: [switchLeg.id] })
        }}
      />
    )
  }

  return null
}
