'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas2D } from '@/src/components/Canvas2D';
import { Viewer } from '@/src/three/Viewer';
import { ToolPanel } from '@/src/components/ToolPanel';
import { Button } from '@/components/ui/button';
import { Box, Layers } from 'lucide-react';
import useStore from '@/src/model/useStore';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

type Tool = 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;

export default function ThreePage() {
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

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full h-full"
        >
          <ResizablePanel defaultSize={60} minSize={20}>
            <div className="h-full w-full relative flex overflow-hidden" ref={containerRef}>
              <aside className="bg-white/90 backdrop-blur-sm border p-2 absolute left-4 top-1/2 -translate-y-1/2 z-10 shadow-md border-gray-200 rounded-xl hidden md:block">
                <ToolPanel
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  className="border-none shadow-none bg-transparent"
                />
              </aside>

              <main className="flex-1 bg-white relative overflow-hidden h-full w-full">
                <div className="absolute inset-0">
                  <Canvas2D
                    width={dimensions.width}
                    height={dimensions.height}
                    activeTool={activeTool}
                  />
                </div>
              </main>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={20}>
             <div className="h-full w-full relative bg-gray-100">
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}