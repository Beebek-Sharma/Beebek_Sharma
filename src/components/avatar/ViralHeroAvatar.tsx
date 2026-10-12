import { useCallback, useEffect, useRef, useState } from 'react'
import Unknown, { type AnimationName } from './Unknown'
import { openAvatarCompanion } from './AvatarCompanion'
import './ViralHeroAvatar.css'

const QUIPS = [
  "Hey there! Explore Beebek's work ↓",
  "Zero redundant compute. Let's build!",
  "Full-stack APIs & AI systems ready.",
  "Need an engineer? You're in the right place!",
  "Tap anywhere to guide you through the portfolio!",
]

const SECTION_GUIDANCE: Record<string, { animation: AnimationName; message: string }> = {
  top: {
    animation: 'idle',
    message: "Hey there! Explore Beebek's work ↓",
  },
  build: {
    animation: 'working',
    message: "What I Build: Backend systems, RAG engines & distributed APIs.",
  },
  work: {
    animation: 'curious',
    message: "Featured Projects: Click any slide to inspect live demo & code.",
  },
  experience: {
    animation: 'thinking',
    message: "Engineering Timeline: Production Django APIs & CSIT degree.",
  },
  about: {
    animation: 'working',
    message: "Identity: Pragmatic engineering bridging low-level compute with AI.",
  },
  interests: {
    animation: 'curious',
    message: "Beyond The Code: Personal disciplines, fiction & gaming reflex.",
  },
  contact: {
    animation: 'celebrate',
    message: "Let's build! Copy direct email or connect on GitHub / LinkedIn.",
  },
}

export function ViralHeroAvatar() {
  const [animation, setAnimation] = useState<AnimationName>('waking')
  const [isPlaying, setIsPlaying] = useState(true)
  const [message, setMessage] = useState(QUIPS[0])
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [quipIndex, setQuipIndex] = useState(0)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Mobility & Positioning
  const [mode, setMode] = useState<'hero' | 'floating'>('hero')
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPositioned, setIsPositioned] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [customFloatPos, setCustomFloatPos] = useState<{ x: number; y: number } | null>(null)

  const currentSectionRef = useRef<string>('top')
  const isHoveringElementRef = useRef(false)
  const revertTimerRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const dragDistanceRef = useRef(0)

  // Motion reduction check
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mq.matches)
    if (mq.matches) setIsPlaying(false)

    const handler = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
      if (e.matches) setIsPlaying(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Tab visibility: pause when tab is hidden to save CPU
  useEffect(() => {
    const handleVisChange = () => {
      if (document.hidden) {
        setIsPlaying(false)
      } else if (!isReducedMotion) {
        setIsPlaying(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisChange)
    return () => document.removeEventListener('visibilitychange', handleVisChange)
  }, [isReducedMotion])

  // Initial wake up sequence
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnimation('idle')
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [])

  // Compute position: anchored in Hero slot or floating across page with comfortable viewport padding
  const updatePosition = useCallback(() => {
    if (isDragging) return
    const anchor = document.getElementById('hero-avatar-anchor')

    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      const isHeroVisible = rect.bottom > 0 && rect.top < window.innerHeight && window.scrollY < 220

      if (isHeroVisible) {
        setMode('hero')
        setCoords({ x: rect.left, y: rect.top })
        setIsPositioned(true)
        return
      }
    }

    // Floating Mode (detached, navigating the page with safe viewport breathing room)
    setMode('floating')
    if (customFloatPos) {
      setCoords(customFloatPos)
    } else {
      const isMobile = window.innerWidth <= 768
      const padRight = isMobile ? 86 : 112
      const padBottom = isMobile ? 86 : 116
      const defaultX = Math.max(24, window.innerWidth - padRight)
      const defaultY = Math.max(24, window.innerHeight - padBottom)
      setCoords({ x: defaultX, y: defaultY })
    }
    setIsPositioned(true)
  }, [isDragging, customFloatPos])

  // Listen for scroll & resize to update positioning smoothly
  useEffect(() => {
    updatePosition()
    const onScrollOrResize = () => {
      window.requestAnimationFrame(updatePosition)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    const t1 = setTimeout(updatePosition, 100)
    const t2 = setTimeout(updatePosition, 400)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [updatePosition])

  // IntersectionObserver: Active Section Detection
  useEffect(() => {
    const sectionIds = ['top', 'build', 'work', 'experience', 'about', 'interests', 'contact']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            const id = entry.target.id
            currentSectionRef.current = id

            if (!isHoveringElementRef.current) {
              const guide = SECTION_GUIDANCE[id]
              if (guide) {
                setAnimation(guide.animation)
                setMessage(guide.message)
                setBubbleVisible(true)
                setShowActionMenu(false)
              }
            }
          }
        })
      },
      { threshold: [0.25, 0.5] }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Event Delegation: Guide user wherever they hover / interact across the page
  useEffect(() => {
    let hoverTimer: number | null = null

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // 1. Primary CTA buttons
      const primaryBtn = target.closest<HTMLElement>('.button-primary, a[href="#work"]')
      if (primaryBtn) {
        isHoveringElementRef.current = true
        setAnimation('curious')
        setMessage("Taking you straight to the featured project builds ↓")
        setBubbleVisible(true)
        return
      }

      // 2. Resume buttons
      const resumeBtn = target.closest<HTMLElement>('.resume-btn, a[href*="resume"]')
      if (resumeBtn) {
        isHoveringElementRef.current = true
        setAnimation('thinking')
        setMessage("Full CSIT degree & engineering credentials dossier ↗")
        setBubbleVisible(true)
        return
      }

      // 3. Project cards & projection slides
      const projectSlide = target.closest<HTMLElement>('.pensatori-work-slide, .project-card')
      if (projectSlide) {
        const title = projectSlide.querySelector<HTMLElement>('.pensatori-slide-title, h3')?.textContent || 'Project'
        isHoveringElementRef.current = true
        setAnimation('excited')
        setMessage(`Inspect ${title} — click to view live demo & source!`)
        setBubbleVisible(true)
        return
      }

      // 4. Capability matrix cards
      const capCard = target.closest<HTMLElement>('.capability-card')
      if (capCard) {
        const title = capCard.querySelector<HTMLElement>('.capability-title')?.textContent || 'Architecture'
        isHoveringElementRef.current = true
        setAnimation('working')
        setMessage(`Inspecting ${title} — high-throughput engineering specs`)
        setBubbleVisible(true)
        return
      }

      // 5. Timeline milestone cards
      const timelineItem = target.closest<HTMLElement>('.stitch-timeline-card')
      if (timelineItem) {
        const role = timelineItem.querySelector<HTMLElement>('.stitch-timeline-role')?.textContent || 'Milestone'
        isHoveringElementRef.current = true
        setAnimation('thinking')
        setMessage(`Reviewing ${role} — verified engineering contributions`)
        setBubbleVisible(true)
        return
      }

      // 6. Beyond The Code Personality Cards
      const beyondCard = target.closest<HTMLElement>('.stitch-beyond-card')
      if (beyondCard) {
        const title = beyondCard.querySelector<HTMLElement>('.stitch-beyond-title')?.textContent || ''
        isHoveringElementRef.current = true
        if (title.includes('Football')) {
          setAnimation('excited')
          setMessage("Cristiano Ronaldo grindset: obsessive work ethic & high standards.")
        } else if (title.includes('Anime')) {
          setAnimation('curious')
          setMessage("One Piece & Dragon Ball lore: creative persistence & narrative systems.")
        } else if (title.includes('Gaming')) {
          setAnimation('working')
          setMessage("Competitive gaming: tactical triage & sub-100ms reflex under pressure.")
        } else if (title.includes('Web Novels')) {
          setAnimation('curious')
          setMessage("Fang Yuan & Reverend Insanity: progression mechanics & systems.")
        } else if (title.includes('Hardware')) {
          setAnimation('working')
          setMessage("Custom Linux ricing, silicon hardware architectures & physical compute.")
        } else {
          setAnimation('curious')
          setMessage(`Personality vector: ${title}`)
        }
        setBubbleVisible(true)
        return
      }

      // 7. Spring Autumn Cicada 3D Talisman (in Contact Section)
      const cicadaWrap = target.closest<HTMLElement>('.stitch-contact-cicada-wrap')
      if (cicadaWrap) {
        isHoveringElementRef.current = true
        setAnimation('curious')
        setMessage("Spring Autumn Cicada talisman: symbolic perseverance & adaptability ↗")
        setBubbleVisible(true)
        return
      }

      // 8. Launch observer button
      const observerBtn = target.closest<HTMLElement>('.stitch-cred-pill-interactive')
      if (observerBtn) {
        isHoveringElementRef.current = true
        setAnimation('playful')
        setMessage("Launch my autonomous observer telemetry console & states!")
        setBubbleVisible(true)
        return
      }

      // 9. Copy email button
      const copyBtn = target.closest<HTMLElement>('.stitch-copy-btn')
      if (copyBtn) {
        isHoveringElementRef.current = true
        setAnimation('happy')
        setMessage("One-click copy Beebek's direct email to clipboard")
        setBubbleVisible(true)
        return
      }

      // 10. Social channels
      const socialLink = target.closest<HTMLElement>('.stitch-channel-card, a[href*="github.com"], a[href*="linkedin.com"]')
      if (socialLink) {
        isHoveringElementRef.current = true
        setAnimation('curious')
        const isGithub = (socialLink as HTMLAnchorElement).href?.includes('github')
        setMessage(isGithub ? "Inspect Beebek's open-source GitHub repositories ↗" : "Connect on LinkedIn for professional network ↗")
        setBubbleVisible(true)
        return
      }

      // 11. Navigation links
      const navLink = target.closest<HTMLElement>('.nav a, .nav-link')
      if (navLink) {
        const text = navLink.textContent?.trim() || 'destination'
        isHoveringElementRef.current = true
        setAnimation('idle')
        setMessage(`Navigate to ${text}`)
        setBubbleVisible(true)
        return
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const interactive = target.closest(
        '.button-primary, .resume-btn, .pensatori-work-slide, .capability-card, .stitch-timeline-card, .stitch-beyond-card, .stitch-contact-cicada-wrap, .stitch-cred-pill-interactive, .stitch-copy-btn, .stitch-channel-card, .nav a'
      )
      if (interactive) {
        if (hoverTimer) window.clearTimeout(hoverTimer)
        hoverTimer = window.setTimeout(() => {
          isHoveringElementRef.current = false
          const sectionId = currentSectionRef.current || 'top'
          const guide = SECTION_GUIDANCE[sectionId] || SECTION_GUIDANCE.top
          setAnimation(guide.animation)
          setMessage(guide.message)
        }, 800)
      }
    }

    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.addEventListener('mouseout', handleMouseOut, { passive: true })

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      if (hoverTimer) window.clearTimeout(hoverTimer)
    }
  }, [])

  // Pointer Dragging & Tap Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: coords.x,
      startY: coords.y,
    }
    dragDistanceRef.current = 0
    setIsDragging(false)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return
    const dx = e.clientX - pointerStartRef.current.pointerX
    const dy = e.clientY - pointerStartRef.current.pointerY
    const dist = Math.hypot(dx, dy)
    dragDistanceRef.current = dist

    if (dist > 5) {
      setIsDragging(true)
      const clampedX = Math.min(Math.max(16, pointerStartRef.current.startX + dx), window.innerWidth - 82)
      const clampedY = Math.min(Math.max(16, pointerStartRef.current.startY + dy), window.innerHeight - 82)
      const newPos = { x: clampedX, y: clampedY }
      setCoords(newPos)
      setCustomFloatPos(newPos)
      setMode('floating')
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {}

    const dist = dragDistanceRef.current
    pointerStartRef.current = null
    setIsDragging(false)

    if (dist < 6) {
      handleAvatarClick()
    }
  }

  // Tapping the avatar triggers playful reactions and opens quick guidance options
  const handleAvatarClick = () => {
    if (revertTimerRef.current) window.clearTimeout(revertTimerRef.current)
    const reactions: AnimationName[] = ['celebrate', 'happy', 'excited', 'playful']
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]
    const nextIndex = (quipIndex + 1) % QUIPS.length

    setAnimation(randomReaction)
    setMessage(QUIPS[nextIndex])
    setQuipIndex(nextIndex)
    setBubbleVisible(true)
    setShowActionMenu(true)
    setIsPlaying(true)

    revertTimerRef.current = window.setTimeout(() => {
      setAnimation('idle')
    }, 4500)
  }

  // Quick navigation action
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
    setShowActionMenu(false)
  }

  // Bubble click: navigate to recommended section
  const handleBubbleClick = () => {
    if (mode === 'hero') {
      scrollToSection('work')
    } else {
      setShowActionMenu((prev) => !prev)
    }
  }

  // Calculate bubble orientation relative to screen boundaries
  const isNearTop = coords.y < 140
  const isNearRight = coords.x > window.innerWidth - 240
  const isNearLeft = coords.x < 180

  const bubbleClasses = [
    'viral-speech-bubble',
    mode === 'hero' ? 'is-hero-dock' : 'is-floating-dock',
    isNearTop ? 'is-flip-down' : 'is-flip-up',
    isNearRight ? 'is-align-right' : isNearLeft ? 'is-align-left' : 'is-align-center',
  ].join(' ')

  return (
    <div
      className={`viral-avatar-host ${mode === 'floating' ? 'is-floating' : 'is-hero-docked'} ${isDragging ? 'is-dragging' : ''}`}
      role="region"
      aria-label="Interactive guide avatar"
      style={{
        transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
        opacity: isPositioned ? 1 : 0,
      }}
    >
      {/* Speech / Thought Bubble (matching viral video screenshot) */}
      {bubbleVisible && (
        <div
          className={bubbleClasses}
          onClick={handleBubbleClick}
          title="Click to interact / navigate"
        >
          <div className="viral-bubble-content">
            <span className="viral-bubble-text">{message}</span>

            {/* Quick Interactive Guide Navigation Menu */}
            {showActionMenu && (
              <div className="viral-bubble-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="viral-action-chip"
                  onClick={() => scrollToSection('work')}
                >
                  ↘ Work
                </button>
                <button
                  type="button"
                  className="viral-action-chip"
                  onClick={() => scrollToSection('experience')}
                >
                  ⏱ Career
                </button>
                <button
                  type="button"
                  className="viral-action-chip"
                  onClick={() => scrollToSection('interests')}
                >
                  ⚡ Beyond
                </button>
                <button
                  type="button"
                  className="viral-action-chip"
                  onClick={() => scrollToSection('contact')}
                >
                  ✉ Contact
                </button>
                <button
                  type="button"
                  className="viral-action-chip viral-action-chip-accent"
                  onClick={() => openAvatarCompanion()}
                  title="Launch full telemetry & animation selector"
                >
                  ⚙ Observer
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="viral-bubble-dismiss"
            onClick={(e) => {
              e.stopPropagation()
              setBubbleVisible(false)
              setShowActionMenu(false)
            }}
            aria-label="Dismiss speech bubble"
            title="Dismiss bubble"
          >
            ×
          </button>
        </div>
      )}

      {/* Glowing Floating Avatar Halo */}
      <div
        className="viral-avatar-halo"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleAvatarClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Interactive animated companion dot. Drag to move, tap to interact."
        title="I can guide you through the page! Drag to move, click to interact."
      >
        <div className="viral-avatar-glow" aria-hidden="true" />
        <Unknown
          animation={animation}
          playing={isPlaying}
          size={58}
          className="viral-avatar-mesh"
        />
      </div>
    </div>
  )
}
