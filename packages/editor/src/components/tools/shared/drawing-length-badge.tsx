import { Html } from '@react-three/drei'

interface DrawingLengthBadgeProps {
  isVisible: boolean
  position: [number, number, number]
  value: string
}

export const DrawingLengthBadge: React.FC<DrawingLengthBadgeProps> = ({
  isVisible,
  position,
  value,
}) => {
  if (!isVisible || !value) return null

  return (
    <Html center pointerEvents="none" position={position} zIndexRange={[90, 0]}>
      <div
        style={{
          background: 'rgba(24,24,27,0.94)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px',
          boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
          color: '#fafafa',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          padding: '6px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </Html>
  )
}
