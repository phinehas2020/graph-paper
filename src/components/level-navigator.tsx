'use client';

import React, { useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, Layers } from 'lucide-react';

export interface Level {
  id: string;
  name: string;
  elevation: number;
}

interface LevelNavigatorProps {
  levels: Level[];
  currentLevelIndex: number;
  onLevelChange: (index: number) => void;
}

export function LevelNavigator({
  levels,
  currentLevelIndex,
  onLevelChange,
}: LevelNavigatorProps) {
  const currentLevel = levels[currentLevelIndex] ?? null;
  const canGoUp = currentLevelIndex < levels.length - 1;
  const canGoDown = currentLevelIndex > 0;

  const goUp = useCallback(() => {
    if (canGoUp) {
      onLevelChange(currentLevelIndex + 1);
    }
  }, [canGoUp, currentLevelIndex, onLevelChange]);

  const goDown = useCallback(() => {
    if (canGoDown) {
      onLevelChange(currentLevelIndex - 1);
    }
  }, [canGoDown, currentLevelIndex, onLevelChange]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goDown();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goUp, goDown]);

  if (levels.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/90 px-2 py-1.5 shadow-xl backdrop-blur-xl">
      {/* Level icon */}
      <Layers size={14} className="text-slate-400" />

      {/* Down button */}
      <button
        type="button"
        onClick={goDown}
        disabled={!canGoDown}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        title="Previous level (Cmd+Down)"
      >
        <ChevronDown size={14} />
      </button>

      {/* Current level display */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-xs font-medium text-slate-200">
          {currentLevel?.name ?? `Level ${currentLevelIndex + 1}`}
        </span>
        <span className="text-xs text-slate-500">
          {currentLevelIndex + 1}/{levels.length}
        </span>
      </div>

      {/* Up button */}
      <button
        type="button"
        onClick={goUp}
        disabled={!canGoUp}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        title="Next level (Cmd+Up)"
      >
        <ChevronUp size={14} />
      </button>

      {/* Level indicator dots */}
      {levels.length > 1 && levels.length <= 8 && (
        <>
          <div className="mx-0.5 h-4 w-px bg-slate-700/50" />
          <div className="flex flex-col-reverse gap-0.5">
            {levels.map((level, index) => (
              <button
                key={level.id}
                type="button"
                onClick={() => onLevelChange(index)}
                className={`h-1.5 w-4 rounded-full transition-colors ${
                  index === currentLevelIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
                title={level.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LevelNavigator;
