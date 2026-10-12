import { useEffect, useRef, useState } from 'react'
import Unknown, { type AnimationName } from './Unknown'
import './AvatarCompanion.css'

const PRESET_ANIMATIONS: { id: AnimationName; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'working', label: 'Working' },
  { id: 'curious', label: 'Curious' },
  { id: 'excited', label: 'Excited' },
  { id: 'sleeping', label: 'Sleeping' },
]

export function openAvatarCompanion() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-avatar-companion'))
  }
}

export function AvatarCompanion() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('idle')
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasRuntimeError, setHasRuntimeError] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [tempReactionTimer, setTempReactionTimer] = useState<number | null>(null)
  const previousAnimationRef = useRef<AnimationName>('idle')

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
    if (mediaQuery.matches) {
      setIsPlaying(false)
    }

    const handler = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
      if (e.matches) setIsPlaying(false)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Pause playback when tab is in background to preserve system resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false)
      } else if (!isReducedMotion && isOpen) {
        setIsPlaying(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isReducedMotion, isOpen])



  // Listen for global open events from other sections (e.g. About matrix)
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true)
      if (!isReducedMotion) setIsPlaying(true)
    }
    window.addEventListener('open-avatar-companion', handleOpenEvent)
    return () => window.removeEventListener('open-avatar-companion', handleOpenEvent)
  }, [isReducedMotion])

  // Clear temporary reaction timer on unmount
  useEffect(() => {
    return () => {
      if (tempReactionTimer !== null) {
        window.clearTimeout(tempReactionTimer)
      }
    }
  }, [tempReactionTimer])

  // Trigger temporary interaction reaction (e.g. happy/celebrate on click)
  const triggerReaction = (reaction: AnimationName, durationMs = 2800) => {
    if (tempReactionTimer !== null) {
      window.clearTimeout(tempReactionTimer)
    }
    previousAnimationRef.current = currentAnimation
    setCurrentAnimation(reaction)
    setIsPlaying(true)

    const timer = window.setTimeout(() => {
      setCurrentAnimation(previousAnimationRef.current)
      setTempReactionTimer(null)
    }, durationMs)
    setTempReactionTimer(timer)
  }

  const handleSelectPreset = (name: AnimationName) => {
    if (tempReactionTimer !== null) {
      window.clearTimeout(tempReactionTimer)
      setTempReactionTimer(null)
    }
    previousAnimationRef.current = name
    setCurrentAnimation(name)
    setIsPlaying(true)
  }

  const toggleOpen = () => {
    setIsOpen(prev => {
      const next = !prev
      if (next && !isReducedMotion) {
        setIsPlaying(true)
      }
      return next
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <aside 
      className={`avatar-companion-dock ${isOpen ? 'is-expanded' : 'is-collapsed'}`}
      aria-label="Synthetic Agent Interactive Companion"
    >
      {/* Minimized Pill Trigger */}
      {!isOpen && (
        <button
          type="button"
          className="companion-pill-trigger"
          onClick={toggleOpen}
          aria-expanded="false"
          aria-controls="companion-card"
          title="Open interactive synthetic companion"
        >
          <span className="companion-pill-avatar-thumb" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
              <ellipse cx="9" cy="11.5" rx="1.8" ry="3.2" fill="#1e8da4" />
              <ellipse cx="15" cy="11.5" rx="1.8" ry="3.2" fill="#1e8da4" />
            </svg>
          </span>
          <span className="companion-pill-status">
            <span className="companion-beacon-dot" aria-hidden="true" />
            <span className="companion-pill-label">AGENT · {currentAnimation.toUpperCase()}</span>
          </span>
          <span className="companion-pill-shortcut" aria-hidden="true">↗</span>
        </button>
      )}

      {/* Expanded Glass Card */}
      {isOpen && (
        <div id="companion-card" className="companion-card" role="region" aria-label="Avatar Companion Controls">
          {/* Card Header */}
          <div className="companion-card-header">
            <div className="companion-meta">
              <span className="companion-beacon-dot" aria-hidden="true" />
              <span className="companion-badge-title">AUTONOMOUS OBSERVER</span>
            </div>
            <button
              type="button"
              className="companion-close-btn"
              onClick={toggleOpen}
              aria-label="Minimize companion"
              title="Minimize"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Stage Stage with Avatar */}
          <div 
            className="companion-stage-well"
            onClick={() => triggerReaction('celebrate')}
            onMouseEnter={() => {
              if (currentAnimation === 'idle' && tempReactionTimer === null) {
                triggerReaction('curious', 2400)
              }
            }}
            title="Click avatar to interact"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                triggerReaction('happy')
              }
            }}
            aria-label="Click avatar to prompt interaction"
          >
            {!hasRuntimeError ? (
              <Unknown
                animation={currentAnimation}
                playing={isPlaying}
                size={160}
                className="companion-avatar-element"
              />
            ) : (
              /* Fallback in case Web Worker / Blob URL import fails */
              <div className="companion-fallback-mesh" aria-label="Static Procedural Avatar Representation">
                <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                  <ellipse cx="40" cy="48" rx="7" ry="14" fill="#1e8da4" />
                  <ellipse cx="60" cy="48" rx="7" ry="14" fill="#1e8da4" />
                </svg>
              </div>
            )}
            <div className="companion-stage-hint" aria-hidden="true">
              <span>TAP TO INTERACT</span>
            </div>
          </div>

          {/* Animation State Selector */}
          <div className="companion-presets-section">
            <span className="companion-section-title">BEHAVIOR VECTOR</span>
            <div className="companion-preset-chips" role="group" aria-label="Select avatar animation preset">
              {PRESET_ANIMATIONS.map((preset) => {
                const isActive = currentAnimation === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`companion-preset-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                    aria-pressed={isActive}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Controls & Telemetry */}
          <div className="companion-footer-row">
            <button
              type="button"
              className="companion-playback-btn"
              onClick={() => setIsPlaying(prev => !prev)}
              aria-label={isPlaying ? 'Pause avatar motion' : 'Play avatar motion'}
            >
              {isPlaying ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>PLAY</span>
                </>
              )}
            </button>

            <span className="companion-telemetry-tag">
              PROCEDURAL MESH
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
