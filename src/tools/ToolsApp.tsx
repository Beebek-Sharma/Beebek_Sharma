import { useEffect, useState, type ReactNode } from 'react'
import { ThemeToggle } from '../ThemeToggle'
import { DecryptedText } from '../DecryptedText'
import { ImageCompressor } from './ImageCompressor'
import { ImageCropper } from './ImageCropper'
import { ImageExifCleaner } from './ImageExifCleaner'
import { PdfTools } from './PdfTools'
import { DocumentTools } from './DocumentTools'
import { EpubTools } from './EpubTools'
import { FileZipTools } from './FileZipTools'
import './ToolsApp.css'

type ToolCategory = 'all' | 'image' | 'pdf' | 'document' | 'file'
type ActiveTool = 'none' | 'compressor' | 'cropper' | 'exif' | 'pdf' | 'document' | 'epub' | 'filezip'

interface ToolDefinition {
  id: ActiveTool
  name: string
  category: ToolCategory
  categoryLabel: string
  description: string
  icon: ReactNode
  badge?: string
}

export function ToolsApp() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all')
  const [activeTool, setActiveTool] = useState<ActiveTool>('none')

  // Read URL hash on load (e.g. #compressor)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveTool
      if (['compressor', 'cropper', 'exif', 'pdf', 'document', 'epub', 'filezip'].includes(hash)) {
        setActiveTool(hash)
      } else {
        setActiveTool('none')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const setToolAndHash = (toolId: ActiveTool) => {
    setActiveTool(toolId)
    if (toolId === 'none') {
      window.history.pushState(null, '', window.location.pathname)
    } else {
      window.location.hash = toolId
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const tools: ToolDefinition[] = [
    {
      id: 'compressor',
      name: 'Image Compressor & Resizer',
      category: 'image',
      categoryLabel: 'Image Tools',
      description: 'Batch compress, resize, format convert (WebP, JPEG, PNG, AVIF), rotate, flip, and compare before/after with live savings stats.',
      badge: 'POPULAR',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      id: 'cropper',
      name: 'Image Cropper & Aspect Tool',
      category: 'image',
      categoryLabel: 'Image Tools',
      description: 'Crop images to standard social and display aspect ratios (1:1, 16:9, 9:16) with custom resolution export.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v14a2 2 0 0 0 2 2h14" />
          <path d="M18 22V8a2 2 0 0 0-2-2H2" />
        </svg>
      ),
    },
    {
      id: 'exif',
      name: 'Image Metadata & EXIF Cleaner',
      category: 'image',
      categoryLabel: 'Image Tools',
      description: 'Inspect embedded camera, GPS, and date tags, and strip all tracking metadata from photos before publishing.',
      badge: 'PRIVACY',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'pdf',
      name: 'PDF Suite, Converter & Editor',
      category: 'pdf',
      categoryLabel: 'PDF Tools',
      description: 'Convert PDF to Word (.docx), PowerPoint (.pptx), images, HTML, or Markdown. Edit pages, add watermarks, page numbers, split, and merge offline.',
      badge: 'POWERFUL',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      id: 'epub',
      name: 'EPUB Studio: Reader, Converter & Creator',
      category: 'document',
      categoryLabel: 'E-Book Tools',
      description: 'Read EPUB e-books with custom themes and font sizes, convert EPUB to PDF / Word (.docx) / Markdown, or compose and compile new .epub books.',
      badge: 'NEW',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: 'document',
      name: 'Document & JSON Formatter',
      category: 'document',
      categoryLabel: 'Document Tools',
      description: 'Format & minify JSON with syntax validation, convert CSV ↔ JSON, preview Markdown, and inspect text word counts.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      id: 'filezip',
      name: 'File Inspector & ZIP Utilities',
      category: 'file',
      categoryLabel: 'File Tools',
      description: 'Generate SHA-256 cryptographic hashes via Web Crypto, batch rename file sets, and create/extract ZIP archives.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
  ]

  const filteredTools =
    activeCategory === 'all' ? tools : tools.filter((t) => t.category === activeCategory)

  // Clear session: resets any active memory buffers and returns to dashboard
  const handleClearSession = () => {
    setToolAndHash('none')
    window.location.reload()
  }

  return (
    <div className="tools-page">
      {/* Header */}
      <header className="tools-header">
        <div className="tools-header-inner">
          <div className="tools-brand-left">
            <a href="/" className="back-home-link" title="Return to Portfolio">
              <span>←</span>
              <span>Portfolio</span>
            </a>
            <div className="tools-title-badge">
              <span className="tools-title-text">BEEBEK // TOOLS</span>
              <span className="privacy-pill">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                100% Client-Side
              </span>
            </div>
          </div>

          <div className="tools-header-right">
            <button
              type="button"
              className="clear-session-btn"
              onClick={handleClearSession}
              title="Reset session and purge temporary browser memory"
            >
              <span>🧹</span>
              <span>Clear Session</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="tools-main-container">
        {activeTool === 'none' ? (
          <>
            {/* Hero */}
            <section className="tools-hero">
              <DecryptedText
                text="01 / Privacy-First Utilities"
                animateOn="view"
                speed={35}
                sequential
                parentClassName="eyebrow"
              />
              <h1>Useful Tools — Right in Your Browser</h1>
              <p>
                Fast, private utilities that process your files locally on your device. Zero server uploads, zero telemetry, and
                zero persistent cookies.
              </p>
              <div className="privacy-pillars-row">
                <span className="privacy-pillar-tag">✓ No Uploads</span>
                <span className="privacy-pillar-tag">✓ Local Processing</span>
                <span className="privacy-pillar-tag">✓ Privacy First</span>
                <span className="privacy-pillar-tag">✓ 100% Free &amp; Open</span>
              </div>
            </section>

            {/* Category Navigation Tabs */}
            <div className="category-filter-bar">
              <button
                type="button"
                className={`category-tab-btn ${activeCategory === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Tools ({tools.length})
              </button>
              <button
                type="button"
                className={`category-tab-btn ${activeCategory === 'image' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('image')}
              >
                🖼 Image Tools ({tools.filter((t) => t.category === 'image').length})
              </button>
              <button
                type="button"
                className={`category-tab-btn ${activeCategory === 'pdf' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('pdf')}
              >
                📄 PDF Suite ({tools.filter((t) => t.category === 'pdf').length})
              </button>
              <button
                type="button"
                className={`category-tab-btn ${activeCategory === 'document' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('document')}
              >
                📝 Document &amp; E-Book ({tools.filter((t) => t.category === 'document').length})
              </button>
              <button
                type="button"
                className={`category-tab-btn ${activeCategory === 'file' ? 'is-active' : ''}`}
                onClick={() => setActiveCategory('file')}
              >
                📦 File &amp; ZIP ({tools.filter((t) => t.category === 'file').length})
              </button>
            </div>

            {/* Tool Cards Grid */}
            <section className="tools-cards-grid">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="tool-card"
                  onClick={() => setToolAndHash(tool.id)}
                >
                  <div className="tool-card-top">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="tool-card-icon-box">{tool.icon}</div>
                      {tool.badge && (
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '0.68rem',
                            letterSpacing: '0.08em',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(91, 156, 130, 0.15)',
                            border: '1px solid rgba(91, 156, 130, 0.3)',
                            color: 'var(--accent-bright)',
                            fontWeight: 700,
                          }}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="tool-card-title">{tool.name}</h3>
                    <p className="tool-card-desc">{tool.description}</p>
                  </div>

                  <div className="tool-card-bottom">
                    <span className="tool-card-category">{tool.categoryLabel}</span>
                    <span className="tool-card-action-btn">
                      <span>Open Tool</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              ))}
            </section>

            {/* Privacy Guarantee Explainer Card */}
            <section className="privacy-guarantee-card">
              <h3>
                <span>🔒</span>
                <span>Privacy Architecture &amp; Security Guarantee</span>
              </h3>
              <div className="privacy-features-grid">
                <div className="privacy-feature-item">
                  <span className="privacy-feature-title">No Server Uploads</span>
                  <span className="privacy-feature-desc">
                    Your photos, documents, and archives never leave your computer. Processing happens directly inside your
                    browser via HTML5 Canvas, WebAssembly, and Web Crypto APIs.
                  </span>
                </div>
                <div className="privacy-feature-item">
                  <span className="privacy-feature-title">Zero File Telemetry</span>
                  <span className="privacy-feature-desc">
                    We do not track file names, hashes, dimensions, or contents. No analytics or metrics are ever attached to
                    your data.
                  </span>
                </div>
                <div className="privacy-feature-item">
                  <span className="privacy-feature-title">Ephemerality &amp; Garbage Collection</span>
                  <span className="privacy-feature-desc">
                    Processed images are maintained in temporary memory buffers and revoked via <code>URL.revokeObjectURL()</code>.
                    Clicking "Clear Session" flushes all active browser resources immediately.
                  </span>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Active Tool Workspace */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="workspace-nav-bar">
              <button
                type="button"
                className="back-to-dashboard-btn"
                onClick={() => setToolAndHash('none')}
              >
                <span>← Back to Tools Dashboard</span>
              </button>

              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--muted)' }}>
                {tools.find((t) => t.id === activeTool)?.name}
              </span>
            </div>

            {/* Render selected workspace tool */}
            {activeTool === 'compressor' && <ImageCompressor />}
            {activeTool === 'cropper' && <ImageCropper />}
            {activeTool === 'exif' && <ImageExifCleaner />}
            {activeTool === 'pdf' && <PdfTools />}
            {activeTool === 'epub' && <EpubTools />}
            {activeTool === 'document' && <DocumentTools />}
            {activeTool === 'filezip' && <FileZipTools />}
          </div>
        )}
      </main>
    </div>
  )
}
