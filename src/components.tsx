import { lazy, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { DecryptedText } from './DecryptedText'
import { ShinyText } from './ShinyText'
import { SoundToggle } from './SoundToggle'
import { ThemeToggle } from './ThemeToggle'
import { links } from './data'
import { useReveal, useScrolled } from './hooks'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>
}

export function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className="section-heading">
    <DecryptedText
      text={eyebrow}
      animateOn="inViewHover"
      speed={35}
      sequential
      parentClassName="eyebrow"
    />
    <h2>{title}</h2>
    {intro && <p>{intro}</p>}
  </div>
}

export function Header() {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()
  const [activeSection, setActiveSection] = useState<string>('')

  const items = [
    ['Work', '#work'],
    ['About', '#about'],
    ['Experience', '#experience'],
    ['Tools', '/tools.html'],
    ['Interests', '#interests'],
    ['Contact', '#contact'],
  ]

  // Track active section on scroll for dynamic nav highlighting
  useEffect(() => {
    const sections = ['work', 'about', 'experience', 'interests', 'contact']
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          return
        }
      }
      if (window.scrollY < 200) {
        setActiveSection('')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        {/* Left: Brand & Live Status Beacon */}
        <div className="header-brand-wrap">
          <a className="wordmark" href="#top" aria-label="Beebek Sharma home" onClick={() => setOpen(false)}>
            <span className="wordmark-prefix">// </span>
            <DecryptedText text="BEEBEK" animateOn="hover" speed={30} sequential />
          </a>
          <div className="nav-status-badge" title="Status: Online & Available for engineering projects">
            <span className="status-dot">
              <span className="status-dot-ping" />
              <span className="status-dot-core" />
            </span>
            <ShinyText text="ONLINE" speed={3} className="status-text" />
          </div>
        </div>

        {/* Center: Desktop Floating Dock */}
        <nav id="site-navigation-desktop" className="nav-pill-dock" aria-label="Primary navigation">
          {items.map(([label, href]) => {
            const isTools = label === 'Tools'
            const isActive = isTools ? false : activeSection === href.replace('#', '')
            return (
              <a
                key={label}
                href={href}
                className={`nav-dock-link ${isActive ? 'is-active' : ''} ${isTools ? 'is-tools-link' : ''}`}
              >
                <span>{label}</span>
                {isTools && <span className="nav-tools-badge">NEW</span>}
              </a>
            )
          })}
        </nav>

        {/* Right: Controls Cluster & Mobile Toggle */}
        <div className="header-right">
          <div className="controls-cluster">
            <SoundToggle />
            <ThemeToggle />
          </div>

          <div className="nav-social-mini">
            <a href={links.github} target="_blank" rel="noreferrer" title="GitHub" aria-label="GitHub">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
            </a>
            <a href={links.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
            </a>
            <a href={links.medium} target="_blank" rel="noreferrer" title="Medium" aria-label="Medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" /></svg>
            </a>
          </div>

          <button
            className={`menu-toggle ${open ? 'is-active' : ''}`}
            type="button"
            aria-expanded={open}
            aria-controls="site-navigation-mobile"
            aria-label={open ? 'Close primary navigation' : 'Open primary navigation'}
            onClick={() => setOpen(!open)}
          >
            <span className="menu-icon-bars" aria-hidden="true">
              <span className="bar bar-top" />
              <span className="bar bar-bottom" />
            </span>
            <span className="menu-toggle-label">{open ? 'CLOSE' : 'MENU'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {open && <div className="nav-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}
      <nav
        id="site-navigation-mobile"
        className={`site-nav-mobile ${open ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="mobile-nav-inner">
          <div className="mobile-nav-links">
            {items.map(([label, href], idx) => {
              const isTools = label === 'Tools'
              const isActive = isTools ? false : activeSection === href.replace('#', '')
              return (
                <a
                  key={label}
                  href={href}
                  className={`mobile-nav-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="mobile-nav-num">0{idx + 1}</span>
                  <span className="mobile-nav-title">{label}</span>
                  {isTools ? (
                    <span className="mobile-tools-badge">UTILITIES ⚡</span>
                  ) : (
                    <span className="mobile-nav-arrow">↗</span>
                  )}
                </a>
              )
            })}
          </div>

          <div className="mobile-nav-footer">
            <div className="mobile-social-links">
              <a href={links.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a>
              <a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn <span>↗</span></a>
              <a href={links.medium} target="_blank" rel="noreferrer">Medium <span>↗</span></a>
            </div>
            <div className="mobile-sys-status">
              <span className="status-dot-core" style={{ width: 6, height: 6 }} />
              <span>SYS: BEEBEK.IO // READY</span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export function ResumeButton() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="resume-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`button button-quiet resume-btn ${open ? 'is-active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Resume options: View online or download PDF"
      >
        Resume <span>{open ? '×' : '↗'}</span>
      </button>

      {open && (
        <div className="resume-menu" role="menu" aria-label="Resume options">
          <a
            href="/resume.html"
            className="resume-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <div className="resume-item-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="resume-item-copy">
              <strong>View Web Resume</strong>
              <small>Open /resume.html on this site</small>
            </div>
            <span className="resume-item-arrow" aria-hidden="true">↗</span>
          </a>

          <div className="resume-menu-divider" role="separator" />

          <a
            href={links.resume}
            download="Beebek_Sharma.pdf"
            className="resume-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <div className="resume-item-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="resume-item-copy">
              <strong>Download PDF</strong>
              <small>Original document copy</small>
            </div>
            <span className="resume-item-arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      )}
    </div>
  )
}

export const FangYuanScene = lazy(() => import('./FangYuanScene').then((module) => ({ default: module.FangYuanScene })))
export const CicadaScene = lazy(() => import('./CicadaScene').then((module) => ({ default: module.CicadaScene })))

export function FangYuanFallback() {
  return <div className="fang-scene-fallback" role="img" aria-label="Fang Yuan 3D statue loading"><span>方源 · FANG YUAN</span><i aria-hidden="true" /><small>GREAT LOVE VENERABLE</small></div>
}

export function CicadaFallback() {
  return <div className="fang-scene-fallback" role="img" aria-label="Spring Autumn Cicada 3D artifact loading"><span>春秋蝉 · SPRING AUTUMN CICADA</span><i aria-hidden="true" /><small>SPRING AUTUMN CICADA</small></div>
}

export function ArchitectureDiagram() {
  const steps = ['Laptop', 'Chrome Extension', 'Native Host', 'Python Signaling', 'WebRTC', 'Another Device']
  return <div className="diagram architecture-diagram" aria-label="LAN Share system architecture">
    {steps.map((step, index) => <div className="diagram-step" key={step}>
      <span className="diagram-index">0{index + 1}</span><span>{step}</span>{index < steps.length - 1 && <b aria-hidden="true">↓</b>}
    </div>)}
  </div>
}

export function PlatformDiagram({ management = false }: { management?: boolean }) {
  const labels = management ? ['Courses', 'People', 'Enrollment', 'Billing'] : ['React', 'REST API', 'Django', 'Database']
  return <div className="diagram platform-diagram" aria-label={management ? 'Institute management system areas' : 'Application layers'}>
    <div className="platform-core">{management ? 'SYSTEM' : 'PRODUCT'}</div>
    <div className="platform-orbit">{labels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}</div>
  </div>
}

export function RagDiagram() {
  return <div className="diagram rag-diagram" aria-label="Retrieval augmented generation pipeline">
    {['Image / Question', 'Processing', 'Retriever / Vector DB', 'LLM', 'Advisory Response'].map((step, index) => <div className="rag-step" key={step}><span>{step}</span>{index < 4 && <b aria-hidden="true">↓</b>}</div>)}
  </div>
}

export function NlpDiagram() {
  return <div className="diagram nlp-diagram" aria-label="Text generation workflow"><span>TEXT</span><b>→</b><span>TRANSFORMER</span><b>→</b><span>MCQ</span></div>
}
