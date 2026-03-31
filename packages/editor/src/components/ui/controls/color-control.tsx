'use client'

import { ColorDot } from '../primitives/color-dot'

interface ColorControlProps {
  color: string
  label?: string
  onChange: (color: string) => void
}

export function ColorControl({ color, label = 'Color', onChange }: ColorControlProps) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <span className="font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-white uppercase">{color}</span>
        <ColorDot color={color} onChange={onChange} />
      </div>
    </div>
  )
}
