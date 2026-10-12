import { Suspense, useState } from 'react'
import { CicadaFallback, CicadaScene, FangYuanFallback, FangYuanScene, ResumeButton, Reveal, SectionHeading } from './components'
import { links, projects } from './data'
import type { Project } from './data'
import { DecryptedText } from './DecryptedText'
import { TextType } from './TextType'
import { ProjectDetailModal } from './ProjectDetailModal'
import { PensatoriProjection } from './PensatoriProjection'
import { openAvatarCompanion } from './components/avatar/AvatarCompanion'

export function Hero() {
  return <section className="hero section-shell" id="top">
    <div className="hero-copy">
      <Reveal className="hero-title-wrap"><h1>Beebek<br /><em>Sharma</em></h1></Reveal>
      <Reveal>
        <div className="hero-role">
          <TextType
            text={[
              'AI / LLM & RAG Systems',
              'Backend & Distributed APIs',
              'Full-Stack Web Applications',
              'Real-Time WebRTC Networks',
            ]}
            typingSpeed={46}
            deletingSpeed={26}
            pauseDuration={2400}
            cursorCharacter="▋"
            cursorClassName="hero-role-cursor"
            loop
          />
        </div>
      </Reveal>
      <Reveal><p className="hero-intro">I build systems, APIs, and intelligent applications that solve practical problems.</p></Reveal>
      <Reveal className="hero-actions">
        <a className="button button-primary" href="#work">Explore work <span>↘</span></a>
        <ResumeButton />
        <div id="hero-avatar-anchor" className="hero-avatar-anchor" aria-hidden="true" />
      </Reveal>
    </div>
    <Reveal className="hero-artifact">
      <Suspense fallback={<FangYuanFallback />}>
        <FangYuanScene />
      </Suspense>
    </Reveal>
    <div className="hero-scroll"><span>Scroll to inspect</span><span className="scroll-line" /></div>
  </section>
}

export function WhatIBuild() {
  const capabilities = [
    {
      engine: 'ENGINE 01',
      title: 'Backend Systems',
      description: 'RESTful API infrastructures, database indexing, granular permissions, session lifecycles, and scalable microservices.',
      tags: ['Django', 'DRF', 'FastAPI', 'PostgreSQL'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2.5" />
          <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="2.5" />
        </svg>
      ),
    },
    {
      engine: 'ENGINE 02',
      title: 'AI • LLM Applications',
      description: 'Multi-modal retrieval augmented generation (RAG), vector similarity search, context chunking, and PyTorch deep models.',
      tags: ['LangChain', 'FAISS', 'Azure OpenAI', 'CNN'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-2 2.82V12a3 3 0 0 0 2 2.82V16a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-1.18A3 3 0 0 0 18 12V9.82A3 3 0 0 0 16 7V6a4 4 0 0 0-4-4z" />
          <circle cx="12" cy="10" r="1.5" />
          <path d="M10.5 14h3" />
        </svg>
      ),
    },
    {
      engine: 'ENGINE 03',
      title: 'Full–Stack Products',
      description: 'Responsive Single-Page Applications engineered with clean state management, modular component architecture, and fluid UX.',
      tags: ['React', 'Vite', 'Tailwind', 'State Mgmt'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="3" ry="3" />
          <path d="m7 9 3 3-3 3" />
          <path d="M13 15h4" />
        </svg>
      ),
    },
    {
      engine: 'ENGINE 04',
      title: 'Networked Systems',
      description: 'Bi-directional WebSocket streaming, peer-to-peer data transport, Redis message broker layers, and local network meshes.',
      tags: ['WebRTC', 'Sockets', 'Redis Pub/Sub', 'Channels'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2" />
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.83a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
        </svg>
      ),
    },
  ]

  return (
    <section className="section-shell build-section" id="build">
      <div className="capability-header">
        <div className="capability-heading-left">
          <div className="capability-eyebrow">
            <span className="capability-dot" aria-hidden="true" />
            <DecryptedText
              text="CAPABILITY MATRIX · LAYER 02"
              animateOn="inViewHover"
              speed={35}
              sequential
              parentClassName="capability-eyebrow-text"
            />
          </div>
          <h2 className="capability-main-title">What I Build</h2>
        </div>
        <p className="capability-intro">
          Machined for reliability and computational ergonomics. From database schema normalization to autonomous AI retrieval.
        </p>
      </div>

      <div className="capability-grid">
        {capabilities.map((item) => (
          <Reveal key={item.engine}>
            <article className="capability-card">
              <div className="capability-icon-well" aria-hidden="true">
                {item.icon}
              </div>
              <span className="capability-engine-label">{item.engine}</span>
              <h3 className="capability-title">{item.title}</h3>
              <p className="capability-desc">{item.description}</p>
              <div className="capability-tags" aria-label={`${item.title} technologies`}>
                {item.tags.map((tag) => (
                  <span key={tag} className="capability-tag">{tag}</span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function SelectedWork() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <section className="section-shell work-section" id="work">
      <SectionHeading
        eyebrow="03 / Curated dispatch"
        title="Featured Projects"
        intro="A selection of high-throughput networked engines, distributed services, and full-stack platforms engineered for scale."
      />

      {/* Pensatori Irrazionali Project Projection System */}
      <Reveal>
        <PensatoriProjection
          projects={projects}
          onSelectProject={(p) => setSelectedProject(p)}
        />
      </Reveal>

      {/* Jesper Landberg Inspired Detailed Project Sheet Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}

export function Experience() {
  const milestones = [
    {
      role: 'Django Developer Intern',
      period: 'Nov 2025 – Feb 2026',
      organization: 'LUNAR I.T. SOLUTION PVT. LTD.',
      orgType: 'Industry Internship',
      description:
        'Developed modular Django and Django REST Framework APIs, worked with relational databases and Linux operating environments, and streamlined team integrations via Git-based CI/CD workflows. Engineered scalable endpoints with strict request verification and optimized ORM database query profiles.',
      tags: ['Django', 'DRF', 'PostgreSQL', 'Linux / Bash', 'Git'],
      active: true,
    },
    {
      role: 'B.Sc. in Computer Science & IT',
      period: 'Tribhuvan University',
      organization: 'Tribhuvan University · Central Campus of Technology',
      orgType: 'Undergraduate Degree · 2022 — 2026',
      description:
        'Core coursework spanning Computer Networks, Distributed Systems, Artificial Intelligence, Database Management Systems, and Object-Oriented Software Engineering.',
      tags: ['Computer Networks', 'Distributed Systems', 'AI & Machine Learning', 'Database Systems'],
      active: false,
    },
  ]

  return (
    <section className="section-shell stitch-timeline-section" id="experience">
      <div className="stitch-timeline-inner">
        <Reveal className="stitch-section-header text-center">
          <div className="stitch-eyebrow-center">
            <span className="stitch-beacon-dot" aria-hidden="true" />
            <span className="stitch-eyebrow-text">CAREER VECTOR</span>
          </div>
          <h2 className="stitch-section-title">Engineering Timeline</h2>
          <p className="stitch-section-subtitle">
            Structured hands-on industry experience building production APIs and systems.
          </p>
        </Reveal>

        {/* Tactile Timeline Rail */}
        <div className="stitch-timeline-rail-wrap">
          <div className="stitch-timeline-rail-line" aria-hidden="true" />

          {milestones.map((item) => (
            <Reveal key={item.role} className="stitch-timeline-item">
              {/* Glowing Junction Bead */}
              <div className="stitch-timeline-bead" aria-hidden="true">
                <span className={`stitch-timeline-bead-core ${item.active ? 'is-active' : ''}`} />
              </div>

              {/* Neumorphic Timeline Card */}
              <article className="stitch-timeline-card">
                <div className="stitch-timeline-card-head">
                  <h3 className="stitch-timeline-role">{item.role}</h3>
                  <span className={`stitch-timeline-period-pill ${item.active ? 'is-active' : ''}`}>
                    {item.period}
                  </span>
                </div>
                <div className="stitch-timeline-org-row">
                  <h4 className="stitch-timeline-org">{item.organization}</h4>
                  <span className="stitch-timeline-org-type">{item.orgType}</span>
                </div>
                <p className="stitch-timeline-desc">{item.description}</p>
                <div className="stitch-timeline-tags" aria-label={`${item.role} technologies`}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="stitch-timeline-tag">{tag}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function About() {
  const taxonomyCategories = [
    {
      title: 'Languages',
      skills: ['Python', 'JavaScript (ES6+)', 'SQL', 'HTML5 / CSS3', 'C / C++'],
    },
    {
      title: 'Backend & Frameworks',
      skills: ['Django', 'Django REST Framework (DRF)', 'FastAPI', 'WebSockets', 'Redis'],
    },
    {
      title: 'AI • LLM • Machine Learning',
      skills: ['LangChain', 'Azure OpenAI Service', 'RAG Architectures', 'PyTorch CNNs', 'ChromaDB / Vector Search'],
    },
    {
      title: 'Frontend • Infrastructure • Tooling',
      skills: ['React.js', 'Tailwind CSS', 'Docker', 'PostgreSQL • SQLite', 'Linux (Debian/Ubuntu)', 'Git / GitHub'],
    },
  ]

  return (
    <section className="section-shell stitch-about-section" id="about">
      {/* Section Header */}
      <Reveal className="stitch-about-header">
        <div className="stitch-eyebrow">
          <span className="stitch-beacon-dot" aria-hidden="true" />
          <span className="stitch-eyebrow-text">PHILOSOPHY • THE MIDDLE LAYER</span>
        </div>
        <h2 className="stitch-col-title">
          Built From The <span className="stitch-highlight">Middle Layer</span>
        </h2>
      </Reveal>

      {/* Middle Layer Hero Composition: Portrait Photo (Left) + Philosophy & Architecture (Right) */}
      <div className="stitch-about-hero-grid">
        {/* Left: High-Fidelity Engineer Portrait & Dossier Specs Card */}
        <Reveal className="stitch-portrait-col">
          <div className="stitch-portrait-card">
            <div className="stitch-portrait-media-well">
              <img
                src="/beebek-sharma-portrait.jpg"
                alt="Beebek Sharma"
                className="stitch-portrait-img"
                width={340}
                height={425}
                loading="eager"
              />
              <div className="stitch-portrait-overlay">
                <div className="stitch-portrait-badge">
                  <span className="stitch-beacon-dot" aria-hidden="true" />
                  <span>KATHMANDU, NEPAL</span>
                </div>
              </div>
            </div>

            <div className="stitch-portrait-body">
              <div className="stitch-portrait-identity">
                <h3 className="stitch-portrait-name">Beebek Sharma</h3>
                <span className="stitch-portrait-role">Computer Science Graduate</span>
              </div>

              <div className="stitch-portrait-specs">
                <div className="stitch-spec-cell">
                  <span className="stitch-spec-label">CORE</span>
                  <span className="stitch-spec-value">AI / LLM & Backend</span>
                </div>
                <div className="stitch-spec-cell">
                  <span className="stitch-spec-label">STACK</span>
                  <span className="stitch-spec-value">React · Django · Python</span>
                </div>
                <div className="stitch-spec-cell">
                  <span className="stitch-spec-label">SYSTEMS</span>
                  <span className="stitch-spec-value">RAG · REST APIs · FastAPI</span>
                </div>
                <div className="stitch-spec-cell">
                  <span className="stitch-spec-label">DEGREE</span>
                  <span className="stitch-spec-value">B.Sc. CSIT</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right: Engineering Philosophy Creed & 4-Tier Layer Architecture Matrix */}
        <Reveal className="stitch-philosophy-col">
          <div className="stitch-neumorphic-card stitch-philosophy-card">
            <p className="stitch-lead-text">
              I’m a Computer Science graduate with hands-on experience across full-stack web development, backend engineering, AI/ML workflows, and local network protocols.
            </p>
            <p className="stitch-body-text">
              Specialized in engineering robust single-page applications with React and JavaScript, combined with production-ready Django, Django REST Framework, and Python backend services. Pragmatic in structuring database schemas, designing resilient authentication, and configuring low-latency LAN interactions.
            </p>

            <div className="stitch-about-credentials">
              <span className="stitch-cred-pill"><span className="stitch-cred-k">DEGREE</span> B.Sc. CSIT</span>
              <span className="stitch-cred-pill"><span className="stitch-cred-k">FOCUS</span> AI & Backend Systems</span>
              <button
                type="button"
                className="stitch-cred-pill stitch-cred-pill-interactive"
                onClick={() => openAvatarCompanion()}
                title="Inspect interactive synthetic agent companion"
              >
                <span className="stitch-cred-k">AGENT</span> Launch Observer ↗
              </button>
            </div>

            {/* Inline SVG Layer Architecture Matrix (4-Tier Spec) */}
            <div className="stitch-architecture-box">
              <div className="stitch-architecture-box-head">
                <span className="stitch-arch-label">LAYER ARCHITECTURE MATRIX</span>
                <span className="stitch-arch-spec">4-TIER SPEC</span>
              </div>

              <div className="stitch-svg-canvas-wrap">
                <svg
                  className="stitch-arch-svg"
                  viewBox="0 0 400 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="4-Tier Layer Architecture Matrix Diagram"
                >
                  {/* Tier 1: Client/Edge */}
                  <rect x="10" y="10" width="80" height="40" rx="8" className="stitch-svg-node" />
                  <text x="50" y="34" textAnchor="middle" className="stitch-svg-text">Client / UI</text>

                  {/* Connector 1 */}
                  <path d="M90 30 L115 30" className="stitch-svg-connector" strokeDasharray="3 3" strokeWidth="1.5" />

                  {/* Tier 2: Gateway / APIs */}
                  <rect x="115" y="10" width="80" height="40" rx="8" className="stitch-svg-node stitch-svg-node-primary" />
                  <text x="155" y="34" textAnchor="middle" className="stitch-svg-text-primary">DRF / FastAPI</text>

                  {/* Connector 2 */}
                  <path d="M195 30 L220 30" className="stitch-svg-connector" strokeDasharray="3 3" strokeWidth="1.5" />

                  {/* Tier 3: AI & Logic */}
                  <rect x="220" y="10" width="80" height="40" rx="8" className="stitch-svg-node" />
                  <text x="260" y="34" textAnchor="middle" className="stitch-svg-text">RAG & Logic</text>

                  {/* Connector 3 */}
                  <path d="M300 30 L325 30" className="stitch-svg-connector" strokeDasharray="3 3" strokeWidth="1.5" />

                  {/* Tier 4: Persistence */}
                  <rect x="325" y="10" width="65" height="40" rx="8" className="stitch-svg-node" />
                  <text x="357" y="34" textAnchor="middle" className="stitch-svg-text">Postgres</text>

                  {/* Real-time lower bus */}
                  <path d="M50 50 L50 90 L357 90 L357 50" className="stitch-svg-bus" strokeWidth="1" />
                  <circle cx="203" cy="90" r="4" className="stitch-svg-bus-beacon" />
                  <text x="203" y="110" textAnchor="middle" className="stitch-svg-bus-text">
                    WEBSOCKET • WEBRTC BUS
                  </text>
                </svg>
              </div>

              <div className="stitch-arch-footer">
                <span>ZERO REDUNDANT COMPUTE</span>
                <span className="stitch-arch-flow">DETERMINISTIC FLOW</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Skills • Tech Taxonomy Capability Registry (id="lab") */}
      <Reveal className="stitch-taxonomy-block">
        <div id="lab" className="stitch-lab-anchor" />
        <div className="stitch-taxonomy-head-row">
          <div className="stitch-eyebrow">
            <span className="stitch-beacon-dot" aria-hidden="true" />
            <span className="stitch-eyebrow-text">SKILLS • CAPABILITY REGISTRY</span>
          </div>
          <h3 className="stitch-col-title stitch-taxonomy-title">Tech Taxonomy</h3>
        </div>

        <div className="stitch-taxonomy-grid">
          {taxonomyCategories.map((cat) => (
            <div key={cat.title} className="stitch-taxonomy-category-card">
              <span className="stitch-taxonomy-label">{cat.title}</span>
              <div className="stitch-taxonomy-pills">
                {cat.skills.map((skill) => (
                  <span key={skill} className="stitch-taxonomy-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="stitch-taxonomy-footer">
          <span className="stitch-taxonomy-status-left">TAXONOMY INTEGRITY: 100%</span>
          <span className="stitch-taxonomy-status-right">SYSTEM READY</span>
        </div>
      </Reveal>
    </section>
  )
}

export function EngineeringLab() {
  return null
}

export function BeyondTheCode() {
  const personalityItems = [
    {
      number: '01 / SPORT',
      title: 'Football Mentality',
      desc: 'Inspired by the obsessive work ethic and preparation of Cristiano Ronaldo — The GOAT. Relentless repetition and high standards under pressure.',
      tag: '#GRINDSET',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24m5.66 0 4.24-4.24M4.93 19.07l4.24-4.24m5.66 0 4.24 4.24" />
          <polygon points="12,8 15,10.5 14,14 10,14 9,10.5" />
        </svg>
      ),
    },
    {
      number: '02 / NARRATIVE',
      title: 'Anime & Lore',
      desc: 'One Piece worldbuilding, Dragon Ball persistence, Bleach, and Naruto. Complex story systems and growth arcs that feed creative problem solving.',
      tag: '#WORLD_BUILDING',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      ),
    },
    {
      number: '03 / TACTICAL',
      title: 'Gaming',
      desc: 'PC & mobile competitive shooters (PUBG, Call of Duty). Tactical map control, rapid triage, and sub-100ms reflexes under high pressure.',
      tag: '#LATENCY_REFLEX',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="12" x2="10" y2="12" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="2.5" />
          <line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="2.5" />
          <rect x="2" y="6" width="20" height="12" rx="4" />
        </svg>
      ),
    },
    {
      number: '04 / FICTION',
      title: 'Web Novels',
      desc: 'Reverend Insanity (Fang Yuan), Lord of the Mysteries, Shadow Slave, ORV, and TBATE. High-velocity narrative worlds and progression mechanics.',
      tag: '#PROGRESSION',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      number: '05 / HARDWARE',
      title: 'Hardware & Systems',
      desc: 'Custom Linux ricing, silicon hardware architectures, microcontrollers, low-latency networking, and edge AI research.',
      tag: '#PHYSICAL_COMPUTING',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3" />
        </svg>
      ),
    },
  ]

  return (
    <section className="section-shell stitch-beyond-section" id="interests">
      <Reveal className="stitch-section-header text-center">
        <div className="stitch-eyebrow-center">
          <span className="stitch-beacon-dot" aria-hidden="true" />
          <span className="stitch-eyebrow-text">PERSONALITY HASH</span>
        </div>
        <h2 className="stitch-section-title">Beyond The Code</h2>
        <p className="stitch-section-subtitle">
          Discipline outside of software development fuels perseverance inside technical systems.
        </p>
      </Reveal>

      <div className="stitch-beyond-grid">
        {personalityItems.map((item) => (
          <Reveal key={item.number} className="stitch-beyond-card-wrap">
            <article className="stitch-beyond-card">
              <div>
                <span className="stitch-beyond-num">{item.number}</span>
                <div className="stitch-beyond-icon-well" aria-hidden="true">
                  {item.icon}
                </div>
                <h3 className="stitch-beyond-title">{item.title}</h3>
                <p className="stitch-beyond-desc">{item.desc}</p>
              </div>
              <span className="stitch-beyond-tag">{item.tag}</span>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Education() {
  return null
}

export function Contact() {
  const [copied, setCopied] = useState(false)
  const email = links.email || 'bibeksharma976@gmail.com'

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  return (
    <section className="section-shell stitch-contact-section" id="contact">
      <div className="stitch-contact-console">
        {/* Glow backlight */}
        <div className="stitch-contact-glow" aria-hidden="true" />

        <div className="stitch-contact-grid">
          {/* Left Column: Communications Dispatch */}
          <Reveal className="stitch-contact-dispatch">
            <h2 className="stitch-contact-title">
              Let’s Build <span className="stitch-highlight">Something.</span>
            </h2>
            <p className="stitch-contact-desc">
              Currently available for full-time software engineering roles, contract backend architectures, or collaborative research on intelligent applications.
            </p>

            {/* Integrated 3D Spring Autumn Cicada Canvas Talisman */}
            <div className="stitch-contact-cicada-wrap">
              <Suspense fallback={<CicadaFallback />}>
                <CicadaScene />
              </Suspense>
            </div>
          </Reveal>

          {/* Right Column: Quick Copy & External Network Matrix */}
          <Reveal className="stitch-contact-actions">
            {/* Quick Copy Email Pod */}
            <div className="stitch-email-pod">
              <div className="stitch-email-pod-left">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="stitch-email-text">{email}</span>
              </div>
              <button
                type="button"
                className={`stitch-copy-btn ${copied ? 'is-copied' : ''}`}
                onClick={handleCopyEmail}
                aria-label="Copy email address"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* External Network Matrix */}
            <div className="stitch-channels-grid">
              <a
                className="stitch-channel-card"
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span>GitHub</span>
              </a>

              <a
                className="stitch-channel-card"
                href={links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                <span>LinkedIn</span>
              </a>

              <a
                className="stitch-channel-card"
                href={links.medium}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
                </svg>
                <span>Medium</span>
              </a>

              <a
                className="stitch-channel-card"
                href={`mailto:${email}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>Direct Mail</span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="stitch-footer">
      <div className="stitch-footer-inner">
        <div className="stitch-footer-dock">
          <div className="stitch-footer-brand">
            <span className="stitch-footer-beacon" aria-hidden="true" />
            <p className="stitch-footer-copy">
              BEEBEK SHARMA
            </p>
          </div>

          <div className="stitch-footer-icons">
            <a
              href={`mailto:${links.email}`}
              className="stitch-footer-icon-btn"
              title="Email"
              aria-label="Email"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="stitch-footer-icon-btn"
              title="GitHub"
              aria-label="GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="stitch-footer-icon-btn"
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href={links.medium}
              target="_blank"
              rel="noopener noreferrer"
              className="stitch-footer-icon-btn"
              title="Medium"
              aria-label="Medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
              </svg>
            </a>
            <a
              href={links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="stitch-footer-icon-btn"
              title="Instagram"
              aria-label="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="#top"
              className="stitch-footer-icon-btn stitch-footer-top-btn"
              title="Back to top"
              aria-label="Back to top"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

