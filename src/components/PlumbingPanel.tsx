import React from 'react';
import type { PlumbingFixture, PlumbingPipe } from '@/src/model/types';

interface PlumbingPanelProps {
  fixtures: PlumbingFixture[];
  pipes: PlumbingPipe[];
}

const PlumbingPanel: React.FC<PlumbingPanelProps> = ({ fixtures, pipes }) => (
  <div className="absolute top-4 left-4 bg-white/90 rounded shadow p-4 text-xs">
    <div className="font-semibold mb-2">Plumbing</div>
    <div>Fixtures: {fixtures.length}</div>
    <div>Pipes: {pipes.length}</div>
  </div>
);

export default PlumbingPanel;
