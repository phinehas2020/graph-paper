import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Square, Minus, MousePointer, Home, Ruler, Type } from 'lucide-react';
import useStore from '@/src/model/useStore';

interface ToolPanelProps {
  activeTool: 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;
  onToolChange: (tool: 'floor' | 'wall' | 'select' | 'measure' | 'text' | null) => void;
  className?: string;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({ 
  activeTool, 
  onToolChange, 
  className 
}) => {
  const { settings, updateSettings, clearTemporaryMeasurements } = useStore();
  const tools = [
    {
      id: 'select' as const,
      name: 'Select',
      icon: MousePointer,
      description: 'Select and move elements',
      shortcut: 'S'
    },
    {
      id: 'floor' as const,
      name: 'Floor',
      icon: Square,
      description: 'Draw floor outline',
      shortcut: 'F'
    },
    {
      id: 'wall' as const,
      name: 'Wall',
      icon: Minus,
      description: 'Draw wall segments',
      shortcut: 'W'
    },
    {
      id: 'measure' as const,
      name: 'Measure',
      icon: Ruler,
      description: 'Measure distances',
      shortcut: 'M'
    },
    {
      id: 'text' as const,
      name: 'Text',
      icon: Type,
      description: 'Add text labels',
      shortcut: 'T'
    }
  ];

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Don't handle tool shortcuts when editing text
    if (settings.isTextEditing) {
      return;
    }
    
    switch (e.key.toLowerCase()) {
      case 's':
        onToolChange('select');
        break;
      case 'f':
        onToolChange('floor');
        break;
      case 'w':
        onToolChange('wall');
        break;
      case 'm':
        onToolChange('measure');
        break;
      case 't':
        onToolChange('text');
        break;
      case 'escape':
        onToolChange(null);
        break;
    }
  }, [onToolChange, settings.isTextEditing]);

  const handleToolChange = React.useCallback((tool: typeof activeTool) => {
    // Clear temporary measurements when switching away from measure tool
    if (activeTool === 'measure' && tool !== 'measure' && settings.measurementMode === 'temporary') {
      clearTemporaryMeasurements();
    }
    onToolChange(tool);
  }, [activeTool, onToolChange, settings.measurementMode, clearTemporaryMeasurements]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Card className={`rounded-xl ${className}`}>
      <CardContent className="p-2 space-y-2 flex flex-col items-center">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className="w-10 h-10"
              onClick={() => handleToolChange(isActive ? null : tool.id)}
              title={`${tool.name} (${tool.shortcut})`}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
