'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ArrowLeft, 
  Grid3X3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Orbit,
  Package,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import useStore from '@/src/model/useStore';
import FlatLayoutCanvas from '@/src/components/FlatLayoutCanvas';

type Point = { x: number; y: number };

export default function FlatLayoutPage() {
  const router = useRouter();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState<Point>({ x: 0, y: 0 });
  
  const { 
    selectFlatPieces, 
    selectConnections, 
    selectSettings,
    stitchPieces,
    switchMode 
  } = useStore();

  const flatPieces = selectFlatPieces();
  const connections = selectConnections();
  const settings = selectSettings();

  // Update canvas size when container resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width - 20, // Account for padding
          height: rect.height - 20
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Switch to flat layout mode when this page loads
  useEffect(() => {
    if (settings.mode !== 'flat-layout') {
      switchMode('flat-layout');
    }
  }, [settings.mode, switchMode]);

  const handleStitchPieces = useCallback(() => {
    console.log('Stitching pieces together...');
    stitchPieces();
    // After stitching, navigate to 3D view
    router.push('/three');
  }, [stitchPieces, router]);

  const handleBackToGraph = useCallback(() => {
    switchMode('traditional');
    router.push('/');
  }, [switchMode, router]);

  const handleExportLayout = useCallback(() => {
    const layoutData = {
      pieces: flatPieces,
      connections: connections,
      settings: {
        gridSize,
        zoom,
        panOffset
      }
    };
    
    const dataStr = JSON.stringify(layoutData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flat-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [flatPieces, connections, gridSize, zoom, panOffset]);

  const handleImportLayout = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const layoutData = JSON.parse(e.target?.result as string);
            console.log('Importing layout:', layoutData);
            // TODO: Implement import functionality
            alert('Import functionality coming soon!');
          } catch (error) {
            alert('Error importing layout file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleBackToGraph}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Graph Paper</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Flat Layout Builder
            </h1>
            <p className="text-sm text-gray-600">
              Create your building like an unfolded cardboard box
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? 'bg-blue-50 text-blue-700' : ''}
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleImportLayout}
                >
                  <Upload className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import Layout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleExportLayout}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Layout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleStitchPieces}
                  disabled={flatPieces.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Stitch & Build 3D
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connect all pieces and create 3D model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 p-2" ref={canvasContainerRef}>
          <Card className="w-full h-full shadow-lg">
            <CardContent className="p-0 w-full h-full">
              <FlatLayoutCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                gridSize={gridSize}
                showGrid={showGrid}
                zoom={zoom}
                panOffset={panOffset}
              />
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="w-80 p-2 space-y-2">
          {/* Zoom Controls */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">View Controls</h3>
              <div className="flex items-center gap-2 mb-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(z => Math.min(5, z + 0.3))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom In</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="px-2 py-1 text-sm text-gray-600 text-center min-w-[3rem]">
                  {Math.round(zoom * 100)}%
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(z => Math.max(0.1, z - 0.3))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom Out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setZoom(1);
                          setPanOffset({ x: 0, y: 0 });
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Grid Size</label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 text-center">
                  {gridSize}px
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Project Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Floor Pieces:</span>
                  <span className="font-medium">
                    {flatPieces.filter(p => p.type === 'floor').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Wall Pieces:</span>
                  <span className="font-medium">
                    {flatPieces.filter(p => p.type === 'wall').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span className="font-medium">{connections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Openings:</span>
                  <span className="font-medium">
                    {flatPieces.reduce((sum, p) => sum + p.openings.length, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/three')}
                >
                  <Orbit className="w-4 h-4 mr-2" />
                  View 3D Preview
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Add template functionality
                    alert('Template system coming soon!');
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Load Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p><strong>Step 1:</strong> Create floor and wall pieces using the tools</p>
                <p><strong>Step 2:</strong> Arrange pieces like an unfolded cardboard box</p>
                <p><strong>Step 3:</strong> Add windows and doors to wall pieces</p>
                <p><strong>Step 4:</strong> Connect edges to define fold lines</p>
                <p><strong>Step 5:</strong> Click "Stitch & Build 3D" to see your building</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}