import React, { useRef, useState, useCallback, useEffect } from 'react'
import './JesperCloseButton.css'

interface JesperCloseButtonProps {
  onClick?: () => void
  onClose?: () => void
  label?: string
  className?: string
  size?: number
}

/**
 * Jesper Landberg Signature Close Button
 * Recreates the magnetic circular pill with kinetic split-stroke cross animation:
 * - Magnetic proximity pull on hover
 * - Solid-to-hollow ring invert transition
 * - Two-stroke diagonal swap (strokes shoot out along their diagonals with stretch,
 *   replacement strokes land in from the opposite direction with staggered lead)
 * - Strict circular mask cut-off so strokes never fade as ghosts
 */
export const JesperCloseButton: React.FC<JesperCloseButtonProps> = ({
  onClick,
  onClose,
  label = 'Close preview',
  className = '',
  size = 46,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    // Magnetic pull factor (0.35)
    const dx = (e.clientX - centerX) * 0.35
    const dy = (e.clientY - centerY) * 0.35
    setOffset({ x: dx, y: dy })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setIsSwapping(true)
    // Reset swap state after animation completes so it can re-trigger on subsequent hovers
    const timer = setTimeout(() => {
      setIsSwapping(false)
    }, 550)
    return () => clearTimeout(timer)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setOffset({ x: 0, y: 0 })
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (onClick) onClick()
    if (onClose) onClose()
  }

  // Accessibility keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`jesper-close-btn ${isHovered ? 'is-hovered' : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={label}
      title={label}
    >
      <span className="jesper-btn-halo" aria-hidden="true" />
      <span className="jesper-btn-disc" aria-hidden="true">
        {/* Kinetic Cross Geometry */}
        <span className={`jesper-cross-mark ${isSwapping ? 'is-animating' : ''}`}>
          {/* Diagonal 1: 45 degrees */}
          <span className="cross-arm arm-diag-1" />
          {/* Diagonal 2: -45 degrees (staggered by MARK_LEAD) */}
          <span className="cross-arm arm-diag-2" />
        </span>
      </span>
    </button>
  )
}

export default JesperCloseButton
