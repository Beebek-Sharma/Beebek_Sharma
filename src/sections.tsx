import { Suspense, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArchitectureDiagram, CicadaFallback, CicadaScene, FangYuanFallback, FangYuanScene, HeroFallback, HeroScene, NlpDiagram, PlatformDiagram, RagDiagram, Reveal, SectionHeading } from './components'
import { experience, interests, labGroups, links, projects, techStack } from './data'

export function Hero() {
  return <section className="hero section-shell" id="top">
    <div className="hero-copy">
      <Reveal><span className="eyebrow">01 / Personal systems</span></Reveal>
      <Reveal className="hero-title-wrap"><h1>Beebek<br /><em>Sharma</em></h1></Reveal>
      <Reveal><div className="hero-role">AI <span>/</span> Backend <span>/</span> Full-stack</div></Reveal>
      <Reveal><p className="hero-intro">I build systems, APIs, and intelligent applications that solve practical problems.</p></Reveal>
      <Reveal className="hero-actions"><a className="button button-primary" href="#work">Explore work <span>↘</span></a><a className="button button-quiet" href={links.resume || '#contact'} download={links.resume ? 'Beebek_Sharma.pdf' : undefined}>{links.resume ? 'Resume' : 'Contact'} <span>↗</span></a></Reveal>
      <Reveal className="hero-meta"><span>Lahan, Nepal</span><span>27°43′N / 85°19′E</span><span>2026</span></Reveal>
    </div>
    <Reveal className="hero-artifacts-pair">
      <div className="hero-artifact-item">
        <Suspense fallback={<CicadaFallback />}>
          <CicadaScene />
        </Suspense>
      </div>
      <div className="hero-artifact-item">
        <Suspense fallback={<FangYuanFallback />}>
          <FangYuanScene />
        </Suspense>
      </div>
    </Reveal>
    <div className="hero-scroll"><span>Scroll to inspect</span><span className="scroll-line" /></div>
  </section>
}

export function WhatIBuild() {
  const items = [
    ['01', 'Backend systems', 'REST APIs, authentication, databases, and the business logic that keeps products dependable.'],
    ['02', 'AI / LLM applications', 'RAG systems, LLM integrations, and intelligent workflows shaped around practical use.'],
    ['03', 'Full-stack products', 'React interfaces connected to robust Python backends, from first endpoint to final interaction.'],
    ['04', 'Networked systems', 'WebRTC, WebSockets, LAN communication, and the real-time layer between devices.'],
  ]
  return <section className="section-shell build-section" id="build"><SectionHeading eyebrow="02 / Capabilities" title="What I build" intro="Software sits at its most interesting where systems meet people." /><div className="build-list">{items.map(([number, title, description]) => <Reveal key={number}><article className="build-item"><span className="item-number">{number}</span><h3>{title}</h3><p>{description}</p><span className="item-arrow">↗</span></article></Reveal>)}</div></section>
}

function ProjectVisual({ visual, title }: { visual: typeof projects[number]['visual']; title: string }) {
  if (visual === 'architecture') return <ArchitectureDiagram />
  if (visual === 'rag') return <RagDiagram />
  if (visual === 'nlp') return <NlpDiagram />
  return <PlatformDiagram management={title === 'Institute Management System'} />
}

export function SelectedWork() {
  return <section className="section-shell work-section" id="work"><SectionHeading eyebrow="03 / Selected work" title="Selected work" intro="A few systems I have built, explored, and learned from." /><div className="project-list">{projects.map((project) => <Reveal key={project.title}><article className={`project project-${project.number}`}><div className="project-main"><div className="project-kicker"><span>{project.number}</span><span>{project.category}</span></div><h3>{project.title}</h3><p>{project.description}</p><div className="tech-list">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div></div><div className="project-visual"><ProjectVisual visual={project.visual} title={project.title} /></div><div className="project-footer">{project.repository ? <a className="project-link" href={project.repository} target="_blank" rel="noreferrer">View on GitHub <span className="project-mark">↗</span></a> : <span>Repository link pending</span>}</div></article></Reveal>)}</div></section>
}

export function Experience() {
  return <section className="section-shell experience-section" id="experience"><SectionHeading eyebrow="04 / Experience" title="Engineering timeline" /><div className="timeline">{experience.map((item) => <Reveal key={item.company}><article className="timeline-item"><div className="timeline-period">{item.period}</div><div className="timeline-marker" aria-hidden="true" /><div className="timeline-copy"><span className="eyebrow">{item.company}</span><h3>{item.role}</h3><p>{item.description}</p></div></article></Reveal>)}</div></section>
}

export function EngineeringLab() {
  const [active, setActive] = useState(0)
  const labMapRef = useRef<HTMLDivElement>(null)
  const wirePaths = [
    ['wire-ai', 'M 50 50 C 42 42, 31 29, 20 20', '20', '20'],
    ['wire-backend', 'M 50 50 C 58 42, 69 29, 80 20', '80', '20'],
    ['wire-systems', 'M 50 50 C 58 58, 69 71, 80 80', '80', '80'],
    ['wire-build', 'M 50 50 C 42 58, 31 71, 20 80', '20', '80'],
  ] as const

  const tiltMap = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !labMapRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    labMapRef.current.style.setProperty('--tilt-x', `${x * 3}deg`)
    labMapRef.current.style.setProperty('--tilt-y', `${y * -3}deg`)
  }

  const resetTilt = () => {
    labMapRef.current?.style.setProperty('--tilt-x', '0deg')
    labMapRef.current?.style.setProperty('--tilt-y', '0deg')
  }

  return <section className="section-shell lab-section" id="lab"><SectionHeading eyebrow="05 / Engineering lab" title="Currently exploring" intro="A working map of the questions, tools, and systems keeping me curious." /><div className="lab-layout"><div ref={labMapRef} className="lab-map" aria-label="Engineering lab topics" onPointerMove={tiltMap} onPointerLeave={resetTilt}>
    <svg className="lab-wires" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><linearGradient id="lab-wire-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#174d3d" /><stop offset="0.5" stopColor="#5b9c82" /><stop offset="1" stopColor="#174d3d" /></linearGradient></defs>{wirePaths.map(([id, path, endX, endY], index) => <g className={active === index ? 'is-active' : ''} key={id}><path id={id} className="lab-wire-track" d={path} /><path className="lab-wire-flow" d={path} /><circle className="lab-wire-terminal" cx={endX} cy={endY} r="1.1" /></g>)}</svg>
    {labGroups.map((group, index) => <button className={`lab-node node-${index} ${active === index ? 'is-active' : ''}`} key={group.label} onClick={() => setActive(index)}><span className="node-index">0{index + 1}</span><strong>{group.label}</strong><small>{group.topics.slice(0, 2).join(' · ')}</small></button>)}<div className="lab-core"><i className="lab-core-orbit" aria-hidden="true" /><span>LAB</span><strong>Engineering<br />Lab</strong></div></div><div className="lab-detail"><span className="eyebrow">Focus / 0{active + 1}</span><h3>{labGroups[active].label}</h3><p>{labGroups[active].detail}</p><div className="lab-topics">{labGroups[active].topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div></div></section>
}

export function About() {
  return <section className="section-shell about-section" id="about"><SectionHeading eyebrow="06 / About" title="Built from the middle layer." /><div className="about-grid"><div className="about-lede">I’m a Computer Science student interested in the intersection of software engineering, artificial intelligence, and systems.</div><div className="about-body"><p>I enjoy building things end-to-end — from backend architecture and APIs to AI pipelines and interactive interfaces.</p><p>My interests currently sit around AI/LLM applications, RAG systems, backend engineering, full-stack development, networking, Linux, and automation.</p></div></div><div className="stack-list">{techStack.map(([category, technologies]) => <div className="stack-row" key={category}><span>{category}</span><p>{technologies}</p></div>)}</div></section>
}

export function BeyondTheCode() {
  return <section className="section-shell interests-section" id="interests"><SectionHeading eyebrow="07 / Beyond the code" title="Other inputs" intro="The things that keep the work human." /><div className="interest-list">{interests.map((interest) => <Reveal key={interest.title}><div className="interest-row"><span>{interest.number}</span><h3>{interest.title}</h3><p>{interest.description}<small>{interest.detail}</small></p></div></Reveal>)}</div></section>
}

export function Education() {
  return <section className="section-shell education-section"><div className="education-label"><span className="eyebrow">08 / Education</span><span className="education-line" /></div><div><h2>B.Sc. CSIT</h2><p>Tribhuvan University<br />Central Campus of Technology<br />2022 — 2026</p></div></section>
}

export function Contact() {
  return <section className="contact-section" id="contact"><div className="contact-inner"><span className="eyebrow">09 / Open channel</span><h2>Let’s build<br /><em>something.</em></h2><p>For projects, collaboration, or technical conversations.</p><div className="contact-links">{links.email ? <a href={`mailto:${links.email}`}>Email <span>↗</span></a> : <span className="contact-pending">Email / address to add</span>}<a href={links.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a><a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn <span>↗</span></a><a href={links.medium} target="_blank" rel="noreferrer">Medium <span>↗</span></a><a href={links.instagram} target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href={links.facebook} target="_blank" rel="noreferrer">Facebook <span>↗</span></a></div></div></section>
}
