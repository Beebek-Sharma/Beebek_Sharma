import { Suspense, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { CicadaFallback, CicadaScene, FangYuanFallback, FangYuanScene, ResumeButton, Reveal, SectionHeading } from './components'
import { experience, interests, labGroups, links, projects, techStack } from './data'
import type { Project } from './data'
import { DecryptedText } from './DecryptedText'
import { TextType } from './TextType'
import FlipCard from './FlipCard'
import { SpotlightCard } from './SpotlightCard'
import { ProjectDetailModal } from './ProjectDetailModal'
import { PensatoriProjection } from './PensatoriProjection'
import { ClothDistortionCanvas } from './ClothDistortionCanvas'

export function Hero() {
  return <section className="hero section-shell" id="top">
    <div className="hero-copy">
      <Reveal className="hero-identity">
        <div className="hero-avatar-wrap">
          <img
            src="/beebek-sharma-avatar.webp"
            alt="Beebek Sharma"
            className="hero-avatar-img"
            width={46}
            height={46}
            loading="eager"
          />
          <span className="hero-avatar-status" title="Available for opportunities" aria-label="Available for opportunities" />
        </div>
        <div className="hero-identity-text">
          <DecryptedText
            text="01 / Personal systems"
            animateOn="view"
            speed={35}
            sequential
            parentClassName="eyebrow"
          />
        </div>
      </Reveal>
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
  const items = [
    ['01', 'Backend systems', 'REST APIs, authentication, databases, and the business logic that keeps products dependable.'],
    ['02', 'AI / LLM applications', 'RAG systems, LLM integrations, and intelligent workflows shaped around practical use.'],
    ['03', 'Full-stack products', 'React interfaces connected to robust Python backends, from first endpoint to final interaction.'],
    ['04', 'Networked systems', 'WebRTC, WebSockets, LAN communication, and the real-time layer between devices.'],
  ]
  return (
    <section className="section-shell build-section" id="build">
      <SectionHeading
        eyebrow="02 / Capabilities"
        title="What I build"
        intro="Software sits at its most interesting where systems meet people."
      />
      <div className="build-list">
        {items.map(([number, title, description]) => (
          <Reveal key={number}>
            <SpotlightCard className="build-spotlight" spotlightColor="rgba(74, 222, 128, 0.16)">
              <article className="build-item">
                <DecryptedText text={number} animateOn="inViewHover" speed={35} sequential parentClassName="item-number" />
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="item-arrow">↗</span>
              </article>
            </SpotlightCard>
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
        eyebrow="03 / Selected work"
        title="Selected work"
        intro="A few systems I have built, explored, and learned from."
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
  return <section className="section-shell about-section" id="about">
    <SectionHeading eyebrow="06 / About" title="Built from the middle layer." />
    <div className="about-content">
      <Reveal className="about-portrait-card">
        <FlipCard
          width={320}
          height={430}
          radius={12}
          tiltMax={10}
          glareOpacity={0.16}
          hoverScale={1.02}
          background="var(--surface)"
          color="var(--text)"
          shadowColor="#000000"
          shadowOpacity={0.4}
          front={
            <div className="portrait-card-front">
              <ClothDistortionCanvas
                imageSrc="/beebek-sharma-portrait.webp"
                alt="Beebek Sharma"
                aspectRatio={320 / 430}
                interactive={true}
                className="about-portrait-cloth-canvas"
              />
              <div className="about-portrait-corner corner-tl" aria-hidden="true" />
              <div className="about-portrait-corner corner-br" aria-hidden="true" />
            </div>
          }
          back={
            <div className="portrait-card-back">
              <div className="card-back-header">
                <div className="card-back-badge">
                  <span className="card-back-dot" />
                  <span>ENGINEER DOSSIER</span>
                </div>
                <span className="card-back-id">// BS-01</span>
              </div>

              <div className="card-back-hero">
                <img
                  src="/beebek-sharma-avatar.webp"
                  alt="Beebek Sharma"
                  className="card-back-avatar"
                  width={44}
                  height={44}
                />
                <div>
                  <h4 className="card-back-name">Beebek Sharma</h4>
                  <span className="card-back-sub">Computer Science Graduate</span>
                </div>
              </div>

              <div className="card-back-specs">
                <div className="card-spec-item">
                  <span className="spec-k">CORE</span>
                  <span className="spec-v">AI / LLM & Backend Systems</span>
                </div>
                <div className="card-spec-item">
                  <span className="spec-k">STACK</span>
                  <span className="spec-v">React · Django · Python</span>
                </div>
                <div className="card-spec-item">
                  <span className="spec-k">SYSTEMS</span>
                  <span className="spec-v">RAG · REST APIs · FastAPI</span>
                </div>
                <div className="card-spec-item">
                  <span className="spec-k">DEGREE</span>
                  <span className="spec-v">B.Sc. CSIT</span>
                </div>
                <div className="card-spec-item">
                  <span className="spec-k">LOCATION</span>
                  <span className="spec-v">Kathmandu, Nepal</span>
                </div>
              </div>

              <div className="card-back-footer">
                <span className="card-flip-return">↻ FLIP BACK</span>
                <span className="card-sys-live">SYS: ONLINE</span>
              </div>
            </div>
          }
          className="about-flip-card"
        />
        <div className="about-portrait-meta">
          <div>
            <strong>Beebek Sharma</strong>
            <span>Computer Science</span>
          </div>
          <span className="about-portrait-loc">Kathmandu, NP</span>
        </div>
      </Reveal>

      <div className="about-narrative">
        <Reveal><div className="about-lede">I’m a Computer Science graduate with practical experience across full-stack web development, backend engineering, AI/ML applications, and networking.</div></Reveal>
        <Reveal className="about-body">
          <p>Experienced in building web applications using React, JavaScript, Django, Django REST Framework, and Python, with hands-on experience developing REST APIs, authentication systems, database-driven applications, and LAN-based applications.</p>
          <p>Familiar with AI/ML concepts, LLM and RAG architectures, and modern development tools with strong problem-solving skills across Git/GitHub, SQL, Docker, Linux, and collaborative workflows.</p>
        </Reveal>
        <Reveal className="about-badges">
          <span className="about-badge"><span>Degree</span> B.Sc. CSIT</span>
          <span className="about-badge"><span>Focus</span> AI & Backend Systems</span>
        </Reveal>
      </div>
    </div>
    <div className="stack-list">{techStack.map(([category, technologies]) => <div className="stack-row" key={category}><span>{category}</span><p>{technologies}</p></div>)}</div>
  </section>
}

export function BeyondTheCode() {
  return (
    <section className="section-shell interests-section" id="interests">
      <SectionHeading eyebrow="07 / Beyond the code" title="Other inputs" intro="The things that keep the work human." />
      <div className="interest-list">
        {interests.map((interest) => (
          <Reveal key={interest.title}>
            <SpotlightCard className="interest-spotlight" spotlightColor="rgba(255, 255, 255, 1)">
              <div className="interest-row">
                <span>{interest.number}</span>
                <h3>{interest.title}</h3>
                <p>
                  {interest.description}
                  <small>{interest.detail}</small>
                </p>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Education() {
  return <section className="section-shell education-section"><div className="education-label"><span className="eyebrow">08 / Education</span><span className="education-line" /></div><div><h2>B.Sc. CSIT</h2><p>Tribhuvan University<br />Central Campus of Technology<br />2022 — 2026</p></div></section>
}

export function Contact() {
  return <section className="contact-section" id="contact"><div className="contact-inner"><div className="contact-copy"><span className="eyebrow">09 / Open channel</span><h2>Let’s build<br /><em>something.</em></h2><p>For projects, collaboration, or technical conversations.</p><div className="contact-links">{links.email ? <a href={`mailto:${links.email}`}>Email <span>↗</span></a> : <span className="contact-pending">Email / address to add</span>}<a href={links.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a><a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn <span>↗</span></a><a href={links.medium} target="_blank" rel="noreferrer">Medium <span>↗</span></a><a href={links.instagram} target="_blank" rel="noreferrer">Instagram <span>↗</span></a><a href={links.facebook} target="_blank" rel="noreferrer">Facebook <span>↗</span></a></div></div><Reveal className="contact-cicada"><Suspense fallback={<CicadaFallback />}><CicadaScene /></Suspense></Reveal></div></section>
}
