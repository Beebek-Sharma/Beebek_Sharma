import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import './SpotlightCard.css'

export interface SpotlightCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  spotlightColor?: string
  onClick?: () => void
}

export function SpotlightCard({
  children,
  className = '',
  style,
  spotlightColor = 'rgba(91, 156, 130, 0.22)',
  onClick,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`spotlight-card ${className}`.trim()}
      style={style}
    >
      <div
        className="spotlight-card__spotlight"
        aria-hidden="true"
        style={{
          opacity,
          background: `radial-gradient(circle 260px at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  )
}

export default SpotlightCard
