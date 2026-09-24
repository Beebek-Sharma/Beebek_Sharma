import { lazy, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { SoundToggle } from './SoundToggle'
import { links } from './data'
import { useReveal, useScrolled } from './hooks'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>()
  return <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>
}

export function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className="section-heading">
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {intro && <p>{intro}</p>}
  </div>
}

export function Header() {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()
  const items = [['Work', 'work'], ['About', 'about'], ['Experience', 'experience'], ['Interests', 'interests']]

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

  return <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
    <div className="header-inner">
      <a className="wordmark" href="#top" aria-label="Beebek Sharma home" onClick={() => setOpen(false)}>BEEBEK<span>.</span></a>
      <div className="header-right">
        <SoundToggle />
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-navigation"
          aria-label={open ? 'Close primary navigation' : 'Open primary navigation'}
          onClick={() => setOpen(!open)}
        >
          <span>{open ? 'Close' : 'Menu'}</span><i aria-hidden="true">{open ? '×' : '↘'}</i>
        </button>
        {open && <div className="nav-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}
        <nav id="site-navigation" className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
          <div className="nav-links">
            {items.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}
          </div>
          <div className="social-links">
            <span className="nav-note">Based in Nepal</span>
            <a href={links.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </nav>
      </div>
    </div>
  </header>
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
