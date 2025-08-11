'use client';

import { useEffect, useState } from 'react';
import { Canvas2D } from '@/src/components/Canvas2D';
import { Viewer } from '@/src/three/Viewer';

type Tool = 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;

export default function ThreePage() {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<Tool>('select');

  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight - 40 });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'f') setActiveTool('floor');
      if (key === 'w') setActiveTool('wall');
      if (key === 's') setActiveTool('select');
      if (key === 'm') setActiveTool('measure');
      if (key === 't') setActiveTool('text');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-2">
        <button className="border px-2 py-1" onClick={() => setMode(mode === '2d' ? '3d' : '2d')}>
          {mode === '2d' ? 'Switch to 3D' : 'Switch to 2D'}
        </button>
      </div>
      <div className="flex-1">
        {mode === '2d' ? (
          <Canvas2D width={dimensions.width} height={dimensions.height} activeTool={activeTool} />
        ) : (
          <Viewer />
        )}
      </div>
    </div>
  );
}

