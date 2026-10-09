import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { Project } from './data'
import { DecryptedText } from './DecryptedText'
import { ClothDistortionCanvas } from './ClothDistortionCanvas'
import './PensatoriProjection.css'

interface PensatoriProjectionProps {
  projects: Project[]
  onSelectProject: (project: Project) => void
}

type ProjectionMode = 'reel' | 'index'

export const PensatoriProjection: React.FC<PensatoriProjectionProps> = ({
  projects,
  onSelectProject,
}) => {
  const [mode, setMode] = useState<ProjectionMode>('reel')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Film Reel drag & momentum state
  const shellRef = useRef<HTMLDivElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Smooth lerp physics for wheel / touchpad auto-scroll
  const targetScrollRef = useRef(0)
  const currentScrollRef = useRef(0)

  // Update active slide index and progress bar
  const updateMetrics = useCallback(() => {
    if (!reelRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = reelRef.current
    const maxScroll = scrollWidth - clientWidth
    if (maxScroll > 0) {
      const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll))
      setScrollProgress(progress)
      const cardWidth = clientWidth > 768 ? 320 : 280
      const index = Math.min(projects.length - 1, Math.max(0, Math.round(scrollLeft / cardWidth)))
      setActiveIndex(index)
    }
  }, [projects.length])

  // Mouse Wheel & Touchpad Horizontal Scroll System
  useEffect(() => {
    if (mode !== 'reel') return
    const shell = shellRef.current
    const reel = reelRef.current
    if (!shell || !reel) return

    // Initialize current positions
    currentScrollRef.current = reel.scrollLeft
    targetScrollRef.current = reel.scrollLeft

    let rafId: number

    // Smooth continuous spring lerp animation loop for wheel / touchpad
    const smoothScrollLoop = () => {
      const activeReel = reelRef.current
      if (activeReel) {
        const diff = targetScrollRef.current - currentScrollRef.current
        if (Math.abs(diff) > 0.35) {
          currentScrollRef.current += diff * 0.16 // Fluid spring glide
          activeReel.scrollLeft = currentScrollRef.current
          updateMetrics()
        } else if (Math.abs(activeReel.scrollLeft - targetScrollRef.current) > 0.1) {
          currentScrollRef.current = targetScrollRef.current
          activeReel.scrollLeft = targetScrollRef.current
          updateMetrics()
        }
      }
      rafId = requestAnimationFrame(smoothScrollLoop)
    }

    rafId = requestAnimationFrame(smoothScrollLoop)

    const handleWheel = (e: WheelEvent) => {
      const activeReel = reelRef.current
      if (!activeReel) return

      const maxScroll = activeReel.scrollWidth - activeReel.clientWidth
      if (maxScroll <= 2) return

      // Extract raw delta from middle mouse wheel (deltaY) or touchpad (deltaX/deltaY)
      let delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 0.2) return

      // Normalize line-mode scrolls (standard Windows physical middle mouse wheel)
      if (e.deltaMode === 1) {
        delta *= 38
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight
      }

      const isScrollingLeft = delta < 0
      const isScrollingRight = delta > 0

      // Only allow native page vertical scroll when already at the absolute ends
      const atStart = activeReel.scrollLeft <= 2 && targetScrollRef.current <= 2
      const atEnd = activeReel.scrollLeft >= maxScroll - 2 && targetScrollRef.current >= maxScroll - 2

      if ((isScrollingLeft && atStart) || (isScrollingRight && atEnd)) {
        // Natural page vertical exit
        return
      }

      // Convert vertical/touchpad scroll into smooth horizontal gliding
      e.preventDefault()

      // Accumulate target with fluid dampening
      targetScrollRef.current = Math.min(
        maxScroll,
        Math.max(0, targetScrollRef.current + delta * 1.3)
      )
    }

    // Attach to the entire shell container so scrolling anywhere over work glides the reel
    shell.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      cancelAnimationFrame(rafId)
      shell.removeEventListener('wheel', handleWheel)
    }
  }, [mode, updateMetrics])

  // Reel horizontal mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!reelRef.current) return
    isDraggingRef.current = true
    setIsDragging(true)
    startXRef.current = e.pageX - reelRef.current.offsetLeft
    scrollLeftRef.current = reelRef.current.scrollLeft
    targetScrollRef.current = reelRef.current.scrollLeft
    currentScrollRef.current = reelRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !reelRef.current) return
    e.preventDefault()
    const x = e.pageX - reelRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    reelRef.current.scrollLeft = scrollLeftRef.current - walk
    targetScrollRef.current = reelRef.current.scrollLeft
    currentScrollRef.current = reelRef.current.scrollLeft
    updateMetrics()
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }

  // Handle native touchpad horizontal scroll sync
  const handleScroll = () => {
    if (!reelRef.current) return
    if (Math.abs(reelRef.current.scrollLeft - currentScrollRef.current) > 25 && !isDraggingRef.current) {
      currentScrollRef.current = reelRef.current.scrollLeft
      targetScrollRef.current = reelRef.current.scrollLeft
    }
    updateMetrics()
  }

  // Scroll reel to specific index via ticks or arrows
  const scrollToIndex = (index: number) => {
    if (!reelRef.current) return
    const cardWidth = reelRef.current.clientWidth > 768 ? 320 : 280
    const target = index * cardWidth
    const maxScroll = reelRef.current.scrollWidth - reelRef.current.clientWidth
    targetScrollRef.current = Math.min(maxScroll, Math.max(0, target))
    setActiveIndex(index)
  }

  return (
    <div ref={shellRef} className="pensatori-projection-shell">
      {/* Telemetry Header & Pensatori Mode Switch Icons */}
      <div className="pensatori-telemetry-bar">
        <div className="pensatori-telemetry-left">
          <span className="pensatori-status-beacon" aria-hidden="true" />
          <span className="pensatori-telemetry-status">STATUS: PROJECTION ACTIVE</span>
          <span className="pensatori-telemetry-sep">/</span>
          <span className="pensatori-telemetry-module">MODULE 03 — RECURSIVE WORK SYSTEM</span>
        </div>

        {/* Pensatori Top-Right Toggle Pill Buttons [-] and [=] */}
        <div className="pensatori-mode-switches" role="tablist" aria-label="Project Projection View">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'reel'}
            className={`pensatori-pill-toggle-btn ${mode === 'reel' ? 'is-active' : ''}`}
            onClick={() => setMode('reel')}
            title="Film Reel Projection View"
            aria-label="Film Reel Projection View"
          >
            {/* Pensatori single-bar icon [-] */}
            <span className="pensatori-icon-bar" aria-hidden="true" />
            <span className="pensatori-toggle-label">REEL</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'index'}
            className={`pensatori-pill-toggle-btn ${mode === 'index' ? 'is-active' : ''}`}
            onClick={() => setMode('index')}
            title="Architectural Index Projection View"
            aria-label="Architectural Index Projection View"
          >
            {/* Pensatori dual-bar icon [=] */}
            <span className="pensatori-icon-dual-bar" aria-hidden="true">
              <span className="dual-bar-line" />
              <span className="dual-bar-line" />
            </span>
            <span className="pensatori-toggle-label">INDEX</span>
          </button>
        </div>
      </div>

      {/* PROJECTION MODE 1: PENSATORI FILM REEL CAROUSEL */}
      {mode === 'reel' && (
        <div className="pensatori-reel-viewport">
          <div
            ref={reelRef}
            className={`pensatori-reel-track ${isDragging ? 'is-dragging' : ''}`}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {projects.map((project, idx) => {
              const previewImg = project.bannerImage || project.screenshots?.[0]?.src || '/projects/mydm-dashboard.png'
              const isCentered = idx === activeIndex

              return (
                <div
                  key={project.number}
                  className={`pensatori-work-slide group ${isCentered ? 'is-centered' : ''}`}
                  onClick={() => {
                    if (!isDragging) onSelectProject(project)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectProject(project)
                    }
                  }}
                  aria-label={`Inspect ${project.title}`}
                >
                  {/* Card Visual Frame */}
                  <div className="pensatori-slide-media-wrap">
                    <div className="pensatori-slide-media-inner">
                      <ClothDistortionCanvas
                        imageSrc={previewImg}
                        alt={project.title}
                        aspectRatio={12 / 16}
                        interactive={true}
                        className="pensatori-slide-canvas"
                      />
                      <div className="pensatori-slide-overlay-veil" aria-hidden="true" />
                    </div>

                    {/* Corner Telemetry Stamps */}
                    <div className="pensatori-slide-badges">
                      <span className="pensatori-slide-num">MOD–{project.number}</span>
                      {project.liveUrl && (
                        <span className="pensatori-slide-live-tag">
                          <span className="live-dot" aria-hidden="true" />
                          <span>LIVE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pensatori Hover Title Reveal (Slides up from translateY(40%)) */}
                  <div className="pensatori-slide-caption">
                    <div className="pensatori-caption-inner">
                      <h4 className="pensatori-caption-title">{project.title}</h4>
                      <span className="pensatori-caption-company">
                        — {project.category}
                      </span>
                    </div>
                    <span className="pensatori-caption-hint">
                      <span>INSPECT</span>
                      <span className="arrow-glyph" aria-hidden="true">↗</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Under-Reel Telemetry & Tick Marks (matching Pensatori screenshot) */}
          <div className="pensatori-reel-footer">
            {/* Pensatori Reel Nav Arrows */}
            <div className="pensatori-reel-arrows">
              <button
                type="button"
                className="pensatori-nav-arrow-btn"
                onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous project"
                title="Scroll left"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="pensatori-nav-arrow-btn"
                onClick={() => scrollToIndex(Math.min(projects.length - 1, activeIndex + 1))}
                disabled={activeIndex === projects.length - 1}
                aria-label="Next project"
                title="Scroll right"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTION MODE 2: PENSATORI ARCHITECTURAL INDEX */}
      {mode === 'index' && (
        <div className="pensatori-index-table">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.number
            const previewImg = project.bannerImage || project.screenshots?.[0]?.src || '/projects/mydm-dashboard.png'

            return (
              <div
                key={project.number}
                className={`pensatori-project-item group ${isExpanded ? 'is-expanded' : ''}`}
              >
                {/* Hairline Interactive Header Row */}
                <div
                  className="pensatori-item-row"
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.number)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpandedProjectId(isExpanded ? null : project.number)
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  {/* Left Column: Number + Giant Architectural Title with Scramble */}
                  <div className="pensatori-item-left">
                    <span className="pensatori-item-id">ID: SYS–{project.number}</span>
                    <h3 className="pensatori-item-title">
                      <DecryptedText
                        text={project.title}
                        animateOn="hover"
                        speed={30}
                        sequential
                      />
                    </h3>
                  </div>

                  {/* Right Column: Speculative Tags, Category, Thumbnail & Dual-Arrow */}
                  <div className="pensatori-item-right">
                    <span className="pensatori-tag-speculative">
                      ({project.number === '01' ? 'Distributed' : project.number === '02' ? 'P2P Signal' : project.number === '03' ? 'Dual-Workflow' : 'Production'})
                    </span>

                    <span className="pensatori-item-category">
                      {project.category}
                    </span>

                    {/* Micro Thumbnail */}
                    <div className="pensatori-item-thumb-box" aria-hidden="true">
                      <img src={previewImg} alt="" className="pensatori-item-thumb" />
                    </div>

                    {/* Signature Pensatori Rotating Dual-Arrow */}
                    <div className="pensatori-item-arrow-slot" aria-hidden="true">
                      <span className="pensatori-arrow-runner rotate-45">
                        <svg className="arrow-lead" viewBox="0 0 18 14" fill="none">
                          <path d="M11 13L17 7L11 1M16 7L1 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <svg className="arrow-trail" viewBox="0 0 18 14" fill="none">
                          <path d="M11 13L17 7L11 1M16 7L1 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pensatori Curtain Projection Reveal (Smooth clip-path expansion) */}
                <div className={`pensatori-curtain-reveal ${isExpanded ? 'is-open' : ''}`}>
                  <div className="pensatori-curtain-content">
                    <div className="pensatori-curtain-grid">
                      {/* Left: Speculative Details */}
                      <div className="pensatori-curtain-meta">
                        <div className="pensatori-curtain-diagram-header">
                          <span className="diagram-dot" aria-hidden="true" />
                          <span>DIAGRAM // {project.title.toUpperCase()} SPECIFICATION</span>
                        </div>
                        <p className="pensatori-curtain-desc">{project.description}</p>

                        <div className="pensatori-curtain-tags">
                          {project.technologies.map((t) => (
                            <span key={t} className="pensatori-pill">
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="pensatori-curtain-actions">
                          <button
                            type="button"
                            className="pensatori-curtain-btn curtain-inspect"
                            onClick={() => onSelectProject(project)}
                          >
                            <span>Inspect 3D Cloth Sheet</span>
                            <span className="arrow-mark" aria-hidden="true">⤢</span>
                          </button>

                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="pensatori-curtain-btn curtain-live"
                            >
                              <span className="live-dot" aria-hidden="true" />
                              <span>Live Deployment</span>
                              <span className="arrow-mark" aria-hidden="true">↗</span>
                            </a>
                          )}

                          {project.repository && (
                            <a
                              href={project.repository}
                              target="_blank"
                              rel="noreferrer"
                              className="pensatori-curtain-btn curtain-code"
                            >
                              <span>Source Code</span>
                              <span className="arrow-mark" aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Full-Bleed Projection Banner */}
                      <div
                        className="pensatori-curtain-visual"
                        onClick={() => onSelectProject(project)}
                        role="button"
                        tabIndex={0}
                        title="Click to launch full interactive sheet"
                      >
                        <ClothDistortionCanvas
                          imageSrc={previewImg}
                          alt={`${project.title} interface`}
                          aspectRatio={16 / 10}
                          interactive={true}
                          className="pensatori-curtain-canvas"
                        />
                        <div className="pensatori-curtain-overlay">
                          <span className="inspect-label">CLICK TO OPEN PROJECTION SHEET ↗</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PensatoriProjection
