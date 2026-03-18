import { Html } from '@react-three/drei'
import { useEffect, useRef } from 'react'

interface DrawingLengthOverlayProps {
  isOpen: boolean
  position: [number, number, number]
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export const DrawingLengthOverlay: React.FC<DrawingLengthOverlayProps> = ({
  isOpen,
  position,
  value,
  onValueChange,
  onSubmit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Html center position={position} zIndexRange={[100, 0]} pointerEvents="auto">
      <div
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.5rem',
          color: '#f4f4f5',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '170px',
          padding: '8px',
          pointerEvents: 'auto',
          width: '170px',
        }}
      >
        <span style={{ color: '#d4d4d8', fontSize: '11px', letterSpacing: '0.02em' }}>
          Segment Length (ft/in)
        </span>
        <input
          ref={inputRef}
          autoComplete="off"
          autoCorrect="off"
          inputMode="text"
          onBlur={onCancel}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              onSubmit()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              onCancel()
            } else if (event.key === 'Tab') {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          placeholder={`10' 6"`}
          value={value}
          style={{
            background: '#27272a',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '0.35rem',
            color: '#fafafa',
            fontFamily: 'monospace',
            fontSize: '14px',
            minHeight: '28px',
            outline: 'none',
            padding: '4px 8px',
            width: '100%',
          }}
          type="text"
        />
      </div>
    </Html>
  )
}
