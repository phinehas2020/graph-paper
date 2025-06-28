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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Drawing Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleToolChange(isActive ? null : tool.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              <div className="flex-1 text-left">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-gray-500">{tool.description}</div>
              </div>
              <kbd className="text-xs bg-gray-100 px-1 rounded">
                {tool.shortcut}
              </kbd>
            </Button>
          );
        })}
        
        <div className="pt-2 border-t space-y-2">
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>Floor Tool:</strong> Click to add points, click near first point to close</div>
            <div><strong>Wall Tool:</strong> Click start, then end. Press Enter to finish.</div>
            <div><strong>Measure Tool:</strong> Click start, then end. Press Enter to finish.</div>
            <div><strong>Text Tool:</strong> Click to place text, type to edit</div>
          </div>
          
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={settings.measurementMode === 'persistent'}
                onChange={(e) => updateSettings({ 
                  measurementMode: e.target.checked ? 'persistent' : 'temporary' 
                })}
                className="w-3 h-3"
              />
              <span>Keep measurements when switching tools</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 