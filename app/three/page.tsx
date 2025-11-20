'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas2D } from '@/src/components/Canvas2D';
import { Viewer } from '@/src/three/Viewer';
import { ToolPanel } from '@/src/components/ToolPanel';
import { Button } from '@/components/ui/button';
import { Box, Layers } from 'lucide-react';
import useStore from '@/src/model/useStore';

type Tool = 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;

export default function ThreePage() {
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { walls, floors } = useStore();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mode]);

  // Note: Keyboard shortcuts are handled by ToolPanel now globally

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Box className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-lg">Graph Paper 3D</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 mr-4">
            {walls.length} Walls | {floors.length} Floors
          </div>
          <Button
            variant={mode === '2d' ? "default" : "outline"}
            size="sm"
            onClick={() => setMode('2d')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            2D Editor
          </Button>
          <Button
            variant={mode === '3d' ? "default" : "outline"}
            size="sm"
            onClick={() => setMode('3d')}
            className="gap-2"
          >
            <Box className="w-4 h-4" />
            3D Viewer
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tools (only visible in 2D) */}
        {mode === '2d' && (
          <aside className="w-64 bg-white border-r p-4 overflow-y-auto">
            <ToolPanel
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />

            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-xs text-blue-700">
              <p className="font-semibold mb-1">Tip:</p>
              <p>Use the Select tool to drag wall endpoints. Connected walls will move together.</p>
            </div>
          </aside>
        )}

        {/* Canvas Area */}
        <main className="flex-1 bg-gray-100 relative overflow-hidden" ref={containerRef}>
          {mode === '2d' ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="bg-white shadow-lg rounded overflow-hidden">
                 {/* We pass explicit dimensions or just let it fill if Canvas2D supports resizing */}
                 <Canvas2D
                   width={dimensions.width - (mode === '2d' ? 40 : 0)} // moderate padding
                   height={dimensions.height - 40}
                   activeTool={activeTool}
                 />
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <Viewer />

              {/* Overlay controls for 3D */}
              <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow backdrop-blur">
                <p className="text-xs text-gray-500">
                  Left Click + Drag to Rotate<br/>
                  Right Click + Drag to Pan<br/>
                  Scroll to Zoom
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
