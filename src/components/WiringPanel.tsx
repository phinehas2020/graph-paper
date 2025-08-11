import React from 'react';
import type { ElectricalOutlet, ElectricalWire } from '@/src/model/types';

interface WiringPanelProps {
  outlets: ElectricalOutlet[];
  wires: ElectricalWire[];
}

const WiringPanel: React.FC<WiringPanelProps> = ({ outlets, wires }) => (
  <div className="absolute top-4 left-4 bg-white/90 rounded shadow p-4 text-xs">
    <div className="font-semibold mb-2">Wiring</div>
    <div>Outlets: {outlets.length}</div>
    <div>Wires: {wires.length}</div>
  </div>
);

export default WiringPanel;
