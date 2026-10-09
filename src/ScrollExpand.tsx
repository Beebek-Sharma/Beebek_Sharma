import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import './ScrollExpand.css'

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1)
  return t * t * (3 - 2 * t)
}

export interface ScrollExpandProps {
  src?: string
  mediaType?: 'image' | 'video'
  poster?: string
  alt?: string
  title?: string
  scrollHint?: string
  startWidth?: number
  startHeight?: number
  startRadius?: number
  endRadius?: number
  mediaZoom?: number
  scrollDistance?: number
  holdDistance?: number
  smoothing?: number
  overlayScrim?: number
  useWindowScroll?: boolean
  enabled?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
}

export function ScrollExpand({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = 'Scroll to explore',
  startWidth = 52,
  startHeight = 62,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.0,
  holdDistance = 0.35,
  smoothing = 0.08,
  overlayScrim = 0.55,
  useWindowScroll = true,
  enabled = true,
  children,
  className = '',
  style,
  id,
  ...rest
}: ScrollExpandProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const propsRef = useRef({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  })

  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  }

  const applyProgress = useCallback((p: number) => {
    const frame = frameRef.current
    const media = mediaRef.current
    if (!frame || !media) return
    const c = propsRef.current

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    // On mobile, if needed, we adjust start dimensions so it never clips awkwardly
    const effectiveStartW = isMobile ? Math.max(c.startWidth, 88) : c.startWidth
    const effectiveStartH = isMobile ? Math.max(c.startHeight, 72) : c.startHeight
    const effectiveRadius = isMobile ? Math.min(c.startRadius, 16) : c.startRadius

    const e = smoothstep(0, 1, p)

    const w = effectiveStartW + (100 - effectiveStartW) * e
    const h = effectiveStartH + (100 - effectiveStartH) * e
    const ix = Math.max(0, (100 - w) / 2)
    const iy = Math.max(0, (100 - h) / 2)
    const r = effectiveRadius + (c.endRadius - effectiveRadius) * e
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`

    if (scrimRef.current) {
      scrimRef.current.style.opacity = `${c.overlayScrim * e}`
    }

    if (titleRef.current) {
      const out = smoothstep(0.25, 0.75, p)
      titleRef.current.style.opacity = `${1 - out}`
      titleRef.current.style.transform = `translate3d(0, ${-24 * out}px, 0) scale(${1 + 0.04 * out})`
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.15, p)
      hintRef.current.style.opacity = `${1 - gone}`
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.55, 0.95, p)
      overlayRef.current.style.opacity = `${inn}`
      overlayRef.current.style.transform = `translate3d(0, ${20 * (1 - inn)}px, 0)`
      overlayRef.current.style.pointerEvents = inn > 0.7 ? 'auto' : 'none'
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    const stage = stageRef.current
    if (!root || !track || !stage) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let current = 0
    let target = 0
    let stageH = 0
    let running = false

    const measure = () => {
      const c = propsRef.current
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight
      if (stageH <= 0) return
      stage.style.height = `${stageH}px`
      
      const isMobile = window.innerWidth < 768
      const effectiveScrollDistance = isMobile ? Math.min(c.scrollDistance, 0.6) : c.scrollDistance
      const effectiveHoldDistance = isMobile ? 0.2 : c.holdDistance
      
      track.style.height = `${stageH * (1 + Math.max(0, effectiveScrollDistance) + Math.max(0, effectiveHoldDistance))}px`

      const w = root.clientWidth || stageH
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.048, 18, 52)}px`)
    }

    const readProgress = () => {
      const c = propsRef.current
      if (!c.enabled) return 1
      const isMobile = window.innerWidth < 768
      const effectiveScrollDistance = isMobile ? Math.min(c.scrollDistance, 0.6) : c.scrollDistance
      const span = stageH * Math.max(0.01, effectiveScrollDistance)
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top
        return clamp(-top / span, 0, 1)
      }
      return clamp(root.scrollTop / span, 0, 1)
    }

    const tick = () => {
      const c = propsRef.current
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing))
      current += (target - current) * k
      if (Math.abs(target - current) < 0.0004) {
        current = target
        running = false
      }
      applyProgress(current)
      raf = running ? requestAnimationFrame(tick) : 0
    }

    const kick = () => {
      if (running) return
      running = true
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      target = readProgress()
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target
        applyProgress(current)
        return
      }
      kick()
    }

    const onResize = () => {
      measure()
      target = readProgress()
      current = target
      applyProgress(current)
    }

    measure()
    target = readProgress()
    current = target
    applyProgress(current)

    const scroller = useWindowScroll ? window : root
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(root)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [applyProgress, useWindowScroll])

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    )

  return (
    <div
      ref={rootRef}
      id={id}
      className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              <span className="scroll-expand__title-text">{title}</span>
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              <span className="scroll-expand__hint-pill">
                <span className="scroll-expand__hint-dot" aria-hidden="true" />
                {scrollHint}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ScrollExpand
