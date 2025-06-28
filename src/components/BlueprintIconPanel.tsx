import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { 
  BLUEPRINT_SYMBOLS, 
  SYMBOL_CATEGORIES, 
  BlueprintSymbol, 
  BlueprintSymbolType,
  getSymbolsByCategory 
} from './BlueprintIcons';

interface BlueprintIconPanelProps {
  onSymbolSelect: (symbol: BlueprintSymbol) => void;
  selectedSymbol?: BlueprintSymbolType | null;
  className?: string;
}

export const BlueprintIconPanel: React.FC<BlueprintIconPanelProps> = ({
  onSymbolSelect,
  selectedSymbol,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['doors', 'windows']) // Start with doors and windows expanded
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <Card className={`w-80 h-full ${className}`}>
      <CardContent className="p-4 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Blueprint Symbols</h3>
          <p className="text-sm text-gray-600">Click to add architectural elements</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {SYMBOL_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const symbols = getSymbolsByCategory(category.id as BlueprintSymbol['category']);
              
              return (
                <div key={category.id} className="border rounded-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4" />
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-gray-500">({symbols.length})</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {isExpanded && (
                    <div className="border-t bg-gray-50">
                      <div className="p-2 grid grid-cols-2 gap-2">
                        {symbols.map((symbol) => (
                          <TooltipProvider key={symbol.type}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={selectedSymbol === symbol.type ? "default" : "ghost"}
                                  size="sm"
                                  className={`h-auto p-3 flex flex-col items-center gap-1 text-xs ${
                                    selectedSymbol === symbol.type 
                                      ? 'bg-blue-100 border-blue-300' 
                                      : 'hover:bg-white'
                                  }`}
                                  onClick={() => onSymbolSelect(symbol)}
                                  style={{ 
                                    color: selectedSymbol === symbol.type ? '#1d4ed8' : symbol.color 
                                  }}
                                >
                                  <symbol.icon className="w-5 h-5" />
                                  <span className="text-center leading-tight">
                                    {symbol.name}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{symbol.name}</p>
                                  <p className="text-sm text-gray-600">{symbol.description}</p>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <p>Size: {symbol.defaultSize.width}" × {symbol.defaultSize.height}"</p>
                                    <div className="flex gap-2">
                                      {symbol.rotatable && <span className="bg-green-100 text-green-700 px-1 rounded">Rotatable</span>}
                                      {symbol.scalable && <span className="bg-blue-100 text-blue-700 px-1 rounded">Scalable</span>}
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="border-t mt-4 pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Click symbols to place on canvas</p>
            <p>• Drag to reposition after placing</p>
            <p>• Right-click for rotation options</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlueprintIconPanel;
