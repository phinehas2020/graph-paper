import { useEffect, useRef } from 'react';
import type { Point } from '@/src/model/types';

interface EditingText {
  position: Point;
  currentText: string;
}

interface TextInputOverlayProps {
  editingText: EditingText;
  onChange: (value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function TextInputOverlay({
  editingText,
  onChange,
  onBlur,
  onKeyDown,
}: TextInputOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingText.currentText === '' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingText]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={editingText.currentText}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Enter text..."
      autoFocus
      className="absolute bg-white border-2 border-blue-500 rounded px-2 py-1 text-sm font-mono shadow-lg outline-none min-w-[100px]"
      style={{
        left: editingText.position.x,
        top: editingText.position.y - 30,
        zIndex: 1000,
      }}
    />
  );
}
