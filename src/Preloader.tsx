import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useReducedMotion } from './hooks'

export function Preloader() {
  const { active, progress } = useProgress()
  const reduced = useReducedMotion()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const targetRef = useRef(15)
  const currentRef = useRef(0)

  useEffect(() => {
    if (reduced) {
      setVisible(false)
      return
    }

    // Prevent scrolling while preloader is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Update target progress as 3D models and assets load
    targetRef.current = Math.max(targetRef.current, Math.round(progress))
    if (!active && progress === 100) {
      targetRef.current = 100
    }

    // Maximum failsafe timer: ensure preloader never gets stuck
    const failsafeTimer = setTimeout(() => {
      targetRef.current = 100
    }, 4500)

    let animationFrameId: number

    const tick = () => {
      // Smooth linear/ease increment towards target
      if (currentRef.current < targetRef.current) {
        const step = Math.max((targetRef.current - currentRef.current) * 0.12, 0.6)
        currentRef.current = Math.min(currentRef.current + step, targetRef.current)
        setDisplayProgress(Math.floor(currentRef.current))
      }

      if (currentRef.current >= 100) {
        setDisplayProgress(100)
        // Brief pause on 100% before smooth fade out
        setTimeout(() => {
          setExiting(true)
          setTimeout(() => {
            setVisible(false)
            document.body.style.overflow = originalOverflow
          }, 550)
        }, 220)
        return
      }

      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(failsafeTimer)
      document.body.style.overflow = originalOverflow
    }
  }, [active, progress, reduced])

  if (!visible) return null

  // Circle dimensions
  const radius = 108
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (circumference * displayProgress) / 100

  return (
    <div
      className={`preloader-overlay ${exiting ? 'is-exiting' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={displayProgress}
      aria-label="Loading portfolio systems and 3D assets"
    >
      <div className="preloader-content">
        <div className="preloader-ring-wrap">
          <svg className="preloader-svg" viewBox="0 0 240 240">
            {/* Background Track Circle */}
            <circle
              className="preloader-track"
              cx="120"
              cy="120"
              r={radius}
            />
            {/* Animated Progress Circle */}
            <circle
              className="preloader-circle"
              cx="120"
              cy="120"
              r={radius}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>
          <div className="preloader-counter">
            <span className="preloader-number">{displayProgress}%</span>
          </div>
        </div>
        <div className="preloader-meta">
          <span>SYS // INITIALIZING</span>
        </div>
      </div>
    </div>
  )
}
