import React, { useEffect } from 'react'
import { Project } from './data'
import { JesperCloseButton } from './JesperCloseButton'
import { ClothDistortionCanvas } from './ClothDistortionCanvas'
import './ProjectDetailModal.css'

interface ProjectDetailModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !project) return null

  const displayUrl = project.liveUrl
    ? project.liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : project.repository?.replace(/^https?:\/\//, '') || 'bibekksharma.com.np'

  return (
    <div
      className="jesper-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} detailed preview`}
    >
      <div
        className="jesper-sheet-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Jesper Landberg Signature Close Button */}
        <div className="jesper-sheet-close-slot">
          <JesperCloseButton
            onClose={onClose}
            label={`Close ${project.title} preview`}
            size={46}
          />
        </div>

        <div className="jesper-sheet-content">
          {/* Left Metadata Column */}
          <div className="jesper-sheet-meta">
            <div className="jesper-sheet-eyebrow">
              <span>{project.number}</span>
              <span className="jesper-sheet-sep">/</span>
              <span>{project.category}</span>
            </div>

            <h2 className="jesper-sheet-title">{project.title}</h2>

            <p className="jesper-sheet-desc">{project.description}</p>

            <div className="jesper-sheet-tags">
              {project.technologies.map((tech) => (
                <span key={tech} className="jesper-tech-pill">
                  {tech}
                </span>
              ))}
            </div>

            <div className="jesper-sheet-actions">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="jesper-action-btn jesper-action-live"
                  title="Open live deployment"
                >
                  <span className="live-status-dot" aria-hidden="true" />
                  <span>Visit Live Website</span>
                  <span className="project-mark" aria-hidden="true">↗</span>
                </a>
              )}

              {project.repository && (
                <a
                  href={project.repository}
                  target="_blank"
                  rel="noreferrer"
                  className="jesper-action-btn jesper-action-code"
                  title="Inspect source code on GitHub"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span>Source Code</span>
                  <span className="project-mark" aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            <div className="jesper-sheet-hint">
              <span className="jesper-hint-dot" aria-hidden="true" />
              <span>Hover & move mouse over image to experience dynamic cloth wave deformation</span>
            </div>
          </div>

          {/* Right Visual Column (Interactive Cloth Mesh Canvas) */}
          <div className="jesper-sheet-visual-col">
            <div className="jesper-visual-window">
              <div className="jesper-window-bar">
                <span className="frame-dot frame-dot-red" />
                <span className="frame-dot frame-dot-yellow" />
                <span className="frame-dot frame-dot-green" />
                <span className="jesper-window-url">{displayUrl}</span>
              </div>

              <div className="jesper-window-canvas-wrap">
                {project.bannerImage ? (
                  <ClothDistortionCanvas
                    imageSrc={project.bannerImage}
                    alt={`${project.title} live interface preview`}
                    aspectRatio={16 / 10}
                    interactive={true}
                  />
                ) : (
                  <div className="jesper-window-placeholder">
                    <span>{project.title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailModal
