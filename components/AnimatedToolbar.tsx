'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolButton {
  name: string;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  color?: string;
}

interface AnimatedToolbarProps {
  tools: ToolButton[];
  activeTool: string;
  onToolChange: (tool: string) => void;
  className?: string;
  isMobile?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function AnimatedToolbar({
  tools,
  activeTool,
  onToolChange,
  className = '',
  isMobile = false,
  orientation = 'horizontal',
}: AnimatedToolbarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  // Find active tool index
  useEffect(() => {
    const index = tools.findIndex((tool) => tool.name === activeTool);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [activeTool, tools]);

  // Haptic feedback simulation
  const triggerFeedback = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Handle tool selection with animation
  const handleToolSelect = (toolName: string, index: number) => {
    setIsAnimating(true);
    setActiveIndex(index);
    onToolChange(toolName);
    triggerFeedback();

    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle long press for tool expansion
  const handleLongPressStart = (toolName: string, e: React.PointerEvent) => {
    e.preventDefault();
    setDragStartY(e.clientY);

    longPressTimer.current = setTimeout(() => {
      setExpandedTool(toolName);
      triggerFeedback();
    }, 200);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setExpandedTool(null);
    setIsDragging(false);
  };

  // Handle drag gesture for tool scrubbing
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && expandedTool && Math.abs(e.clientY - dragStartY) > 10) {
      setIsDragging(true);
    }

    if (isDragging && scrollRef.current) {
      const rect = scrollRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const toolHeight = isMobile ? 56 : 48; // h-14 vs h-12
      const newIndex = Math.max(
        0,
        Math.min(tools.length - 1, Math.floor(relativeY / toolHeight)),
      );

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        triggerFeedback();
      }
    }
  };

  // Scroll effects for scale animation
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    // Add scale effects to items based on distance from center
    const items = container.children;
    Array.from(items).forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.top + itemRect.height / 2;
      const distance = Math.abs(itemCenter - containerCenter);
      const maxDistance = containerRect.height / 2;
      const scale = Math.max(0.8, 1 - (distance / maxDistance) * 0.2);

      const element = item as HTMLElement;
      element.style.transform = `scale(${scale})`;
      element.style.opacity = `${Math.max(0.6, scale)}`;
    });
  };

  return (
    <Card
      className={`shadow-xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 ${isAnimating ? 'scale-105' : ''} ${className}`}
    >
      <CardContent className={isMobile ? 'p-1' : 'p-2'}>
        <div
          ref={scrollRef}
          className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center gap-1 ${
            isMobile && orientation === 'horizontal'
              ? 'flex-wrap justify-center'
              : ''
          } overflow-auto scrollbar-hide`}
          onScroll={handleScroll}
          style={{
            maxHeight:
              orientation === 'vertical'
                ? isMobile
                  ? '60vh'
                  : '50vh'
                : undefined,
            maxWidth:
              orientation === 'horizontal'
                ? isMobile
                  ? '90vw'
                  : '70vw'
                : undefined,
          }}
        >
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.name;
            const isExpanded = expandedTool === tool.name;

            return (
              <TooltipProvider
                key={tool.name}
                delayDuration={isMobile ? 0 : 100}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => handleToolSelect(tool.name, index)}
                      onPointerDown={(e) => handleLongPressStart(tool.name, e)}
                      onPointerUp={handleLongPressEnd}
                      onPointerLeave={handleLongPressEnd}
                      onPointerMove={handlePointerMove}
                      className={`
                        ${isMobile ? 'w-14 h-14' : 'w-12 h-12'}
                        transition-all duration-300 ease-out
                        ${isActive ? 'bg-blue-100 text-blue-700 shadow-md' : 'hover:bg-gray-100 text-gray-700'}
                        ${isExpanded ? 'scale-125 shadow-lg z-10' : ''}
                        active:scale-95
                        relative overflow-hidden
                      `}
                      style={{
                        backgroundColor:
                          isActive && tool.color
                            ? `${tool.color}20`
                            : undefined,
                        borderColor:
                          isActive && tool.color ? tool.color : undefined,
                        transform: isExpanded ? 'scale(1.25)' : undefined,
                        zIndex: isExpanded ? 10 : 1,
                      }}
                      aria-label={tool.label}
                    >
                      <Icon
                        className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-200`}
                        style={{
                          color:
                            isActive && tool.color ? tool.color : undefined,
                        }}
                      />

                      {/* Ripple effect overlay */}
                      <div
                        className={`
                          absolute inset-0 rounded-md opacity-0 
                          ${isActive ? 'animate-pulse opacity-10' : ''}
                        `}
                        style={{ backgroundColor: tool.color || '#3b82f6' }}
                      />

                      {/* Active indicator */}
                      {isActive && (
                        <div
                          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-70"
                          style={{ backgroundColor: tool.color || '#3b82f6' }}
                        />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side={
                      orientation === 'vertical'
                        ? 'right'
                        : isMobile
                          ? 'top'
                          : 'bottom'
                    }
                    className="bg-gray-900 text-gray-200"
                  >
                    <p>
                      {tool.label} {tool.shortcut && `(${tool.shortcut})`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
