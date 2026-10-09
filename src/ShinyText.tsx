import type { CSSProperties, ReactNode } from 'react'
import './ShinyText.css'

export interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
  style?: CSSProperties
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3.5,
  className = '',
  style,
}: ShinyTextProps) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`.trim()}
      style={{ animationDuration, ...style }}
    >
      {text}
    </span>
  )
}

export default ShinyText
