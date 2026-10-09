import { useState } from 'react'
import { downloadBlob, formatBytes } from './toolUtils'
import {
  parseEpub,
  createEpub,
  convertEpubToPdf,
  convertEpubToDocx,
  type ParsedEpub,
  type EpubChapter,
} from './epubUtils'
import './EpubTools.css'

type EpubSubTool = 'reader' | 'convert' | 'create'
type EpubConvertTarget = 'pdf' | 'docx' | 'md' | 'txt' | 'html'
type ReadingTheme = 'dark' | 'light' | 'sepia'

export function EpubTools() {
  const [subTool, setSubTool] = useState<EpubSubTool>('reader')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Loaded EPUB State
  const [epubFile, setEpubFile] = useState<File | null>(null)
  const [parsedEpub, setParsedEpub] = useState<ParsedEpub | null>(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0)

  // Reader Settings
  const [readerTheme, setReaderTheme] = useState<ReadingTheme>('dark')
  const [readerFontSize, setReaderFontSize] = useState<number>(17)

  // Converter State
  const [convertTarget, setConvertTarget] = useState<EpubConvertTarget>('pdf')

  // Creator State
  const [createTitle, setCreateTitle] = useState<string>('My Digital Notes & Stories')
  const [createAuthor, setCreateAuthor] = useState<string>('Beebek Sharma')
  const [createLanguage, setCreateLanguage] = useState<string>('en')
  const [createChapters, setCreateChapters] = useState<{ title: string; content: string }[]>([
    {
      title: 'Chapter 1: The Beginning',
      content:
        'This is the first chapter of your custom EPUB e-book.\n\nYou can compose multi-paragraph chapters, notes, or stories right here in your browser and export a standard .epub file that works across Apple Books, Kindle, Kobo, and Android readers.',
    },
    {
      title: 'Chapter 2: Privacy First',
      content:
        'All e-book compilation happens entirely on your device using client-side JavaScript. No drafts, manuscripts, or notes are uploaded to any server.',
    },
  ])

  // Clear All
  const handleClearAll = () => {
    if (parsedEpub?.coverUrl) {
      URL.revokeObjectURL(parsedEpub.coverUrl)
    }
    setEpubFile(null)
    setParsedEpub(null)
    setActiveChapterIndex(0)
    setStatusMessage('')
  }

  // Load EPUB file
  const handleUploadEpub = async (file: File) => {
    setEpubFile(file)
    setIsProcessing(true)
    setStatusMessage('Unpacking EPUB archive in browser...')

    try {
      const buffer = await file.arrayBuffer()
      const parsed = await parseEpub(buffer)
      setParsedEpub(parsed)
      setActiveChapterIndex(0)
      setStatusMessage(`Loaded "${parsed.metadata.title}" (${parsed.chapters.length} chapters)`)
    } catch (err) {
      console.error(err)
      setStatusMessage(`Error parsing EPUB: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Convert EPUB
  const handleConvertEpub = async () => {
    if (!parsedEpub) return
    setIsProcessing(true)
    setStatusMessage(`Converting to ${convertTarget.toUpperCase()}...`)

    try {
      const safeTitle = parsedEpub.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_')

      if (convertTarget === 'pdf') {
        setStatusMessage('Paginating chapters into PDF document...')
        const pdfBlob = await convertEpubToPdf(parsedEpub)
        downloadBlob(pdfBlob, `${safeTitle}.pdf`)
        setStatusMessage('Downloaded PDF document!')
      } else if (convertTarget === 'docx') {
        setStatusMessage('Generating Microsoft Word (.docx) document...')
        const docxBlob = await convertEpubToDocx(parsedEpub)
        downloadBlob(docxBlob, `${safeTitle}.docx`)
        setStatusMessage('Downloaded Word (.docx) document!')
      } else if (convertTarget === 'md') {
        let md = `# ${parsedEpub.metadata.title}\n\n**Author:** ${parsedEpub.metadata.creator}\n\n---\n\n`
        parsedEpub.chapters.forEach((ch, idx) => {
          md += `## Chapter ${idx + 1}: ${ch.title}\n\n${ch.textContent}\n\n---\n\n`
        })
        const mdBlob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
        downloadBlob(mdBlob, `${safeTitle}.md`)
        setStatusMessage('Downloaded Markdown (.md)!')
      } else if (convertTarget === 'html') {
        let body = `<h1>${parsedEpub.metadata.title}</h1>\n<p><strong>By ${parsedEpub.metadata.creator}</strong></p>\n<hr/>\n`
        parsedEpub.chapters.forEach((ch) => {
          body += `<section style="margin: 2rem 0; padding-bottom: 2rem; border-bottom: 1px solid #ddd;">\n<h2>${ch.title}</h2>\n${ch.htmlContent}\n</section>\n`
        })
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${parsedEpub.metadata.title}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#222;}</style></head><body>${body}</body></html>`
        const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' })
        downloadBlob(htmlBlob, `${safeTitle}.html`)
        setStatusMessage('Downloaded HTML book!')
      } else {
        // Plain text
        let txt = `${parsedEpub.metadata.title}\nBy ${parsedEpub.metadata.creator}\n\n`
        parsedEpub.chapters.forEach((ch, idx) => {
          txt += `\n=== Chapter ${idx + 1}: ${ch.title} ===\n\n${ch.textContent}\n`
        })
        const txtBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
        downloadBlob(txtBlob, `${safeTitle}.txt`)
        setStatusMessage('Downloaded plain text (.txt)!')
      }
    } catch (err) {
      console.error(err)
      setStatusMessage(`Conversion error: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Create EPUB
  const handleCreateEpub = async () => {
    if (!createTitle.trim() || createChapters.length === 0) {
      setStatusMessage('Please enter a title and at least one chapter.')
      return
    }

    setIsProcessing(true)
    setStatusMessage('Compiling EPUB e-book package...')

    try {
      const blob = await createEpub({
        title: createTitle,
        author: createAuthor || 'Anonymous',
        language: createLanguage,
        chapters: createChapters,
      })

      const filename = `${createTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.epub`
      downloadBlob(blob, filename)
      setStatusMessage(`Downloaded "${filename}" successfully! Ready for e-readers.`)
    } catch (err) {
      console.error(err)
      setStatusMessage(`Error creating EPUB: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const activeChapter: EpubChapter | undefined = parsedEpub?.chapters[activeChapterIndex]

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>EPUB Studio: Reader, Converter &amp; Creator</h2>
          <p>
            Read e-books, convert EPUB to PDF/DOCX, or compose and compile new standard .epub books entirely in your
            browser.
          </p>
        </div>
        <button className="clear-all-btn" onClick={handleClearAll}>
          Clear All
        </button>
      </div>

      {/* Subtool Navigation */}
      <div className="epub-nav">
        <button
          className={`epub-nav-btn ${subTool === 'reader' ? 'active' : ''}`}
          onClick={() => setSubTool('reader')}
        >
          📖 EPUB Reader &amp; Inspector
        </button>
        <button
          className={`epub-nav-btn ${subTool === 'convert' ? 'active' : ''}`}
          onClick={() => setSubTool('convert')}
        >
          🔄 Convert EPUB (to PDF/DOCX)
        </button>
        <button
          className={`epub-nav-btn ${subTool === 'create' ? 'active' : ''}`}
          onClick={() => setSubTool('create')}
        >
          ✍️ Create EPUB Book
        </button>
      </div>

      {statusMessage && (
        <div className="action-status-banner">
          <span>{statusMessage}</span>
        </div>
      )}

      {/* --- SUBTOOL 1: READER --- */}
      {subTool === 'reader' && (
        <div className="tool-panel-box">
          {!parsedEpub ? (
            <div className="upload-dropzone" onClick={() => document.getElementById('epub-file-input')?.click()}>
              <input
                id="epub-file-input"
                type="file"
                accept=".epub,application/epub+zip"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadEpub(e.target.files[0])
                  }
                }}
              />
              <div className="dropzone-icon">📚</div>
              <div className="dropzone-text">Drop an .epub book file here</div>
              <div className="dropzone-sub">Read offline, inspect chapters &amp; examine book metadata</div>
            </div>
          ) : (
            <div className="epub-reader-layout">
              {/* Sidebar with book cover & TOC */}
              <div className="epub-sidebar">
                {parsedEpub.coverUrl ? (
                  <img src={parsedEpub.coverUrl} alt="Cover" className="epub-cover-thumb" />
                ) : (
                  <div
                    style={{
                      height: '140px',
                      background: 'var(--surface-3)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                    }}
                  >
                    📖
                  </div>
                )}

                <div className="epub-meta-block">
                  <div className="epub-book-title">{parsedEpub.metadata.title}</div>
                  <div className="epub-book-author">By {parsedEpub.metadata.creator}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {parsedEpub.chapters.length} Chapters • ~{Math.round(parsedEpub.totalCharacters / 5)} Words
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="secondary-btn"
                    style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setSubTool('convert')
                    }}
                  >
                    🔄 Convert
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleClearAll}
                  >
                    Close
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '0.5rem' }}>Table of Contents:</div>
                <div className="epub-toc-list">
                  {parsedEpub.chapters.map((ch, idx) => (
                    <button
                      key={ch.id || idx}
                      className={`epub-toc-item ${activeChapterIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveChapterIndex(idx)}
                      title={ch.title}
                    >
                      {idx + 1}. {ch.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Reading Canvas */}
              <div className={`epub-reading-pane theme-${readerTheme}`}>
                <div className="epub-reader-header">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {activeChapter?.title || 'Chapter'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Theme selector */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="page-btn-icon"
                        style={{ background: '#0a0e0c', color: '#fff', border: '1px solid #333' }}
                        title="Dark Theme"
                        onClick={() => setReaderTheme('dark')}
                      >
                        🌙
                      </button>
                      <button
                        className="page-btn-icon"
                        style={{ background: '#fdfdfd', color: '#000', border: '1px solid #ccc' }}
                        title="Light Theme"
                        onClick={() => setReaderTheme('light')}
                      >
                        ☀️
                      </button>
                      <button
                        className="page-btn-icon"
                        style={{ background: '#fbf0d9', color: '#433422', border: '1px solid #d4c29d' }}
                        title="Sepia Theme"
                        onClick={() => setReaderTheme('sepia')}
                      >
                        📜
                      </button>
                    </div>

                    {/* Font size */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                      <button
                        className="page-btn-icon"
                        disabled={readerFontSize <= 13}
                        onClick={() => setReaderFontSize((s) => Math.max(13, s - 1))}
                      >
                        A-
                      </button>
                      <span>{readerFontSize}px</span>
                      <button
                        className="page-btn-icon"
                        disabled={readerFontSize >= 26}
                        onClick={() => setReaderFontSize((s) => Math.min(26, s + 1))}
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="epub-content-body"
                  style={{ fontSize: `${readerFontSize}px` }}
                  dangerouslySetInnerHTML={{
                    __html: activeChapter?.htmlContent || `<p>${activeChapter?.textContent || ''}</p>`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 2: CONVERT --- */}
      {subTool === 'convert' && (
        <div className="tool-panel-box">
          <h3>Convert EPUB to Other Formats</h3>
          <p className="tool-panel-desc">
            Transform EPUB e-books into formatted PDF documents, editable Word documents (.docx), or markdown files.
          </p>

          {!parsedEpub ? (
            <div className="upload-dropzone" onClick={() => document.getElementById('epub-convert-input')?.click()}>
              <input
                id="epub-convert-input"
                type="file"
                accept=".epub,application/epub+zip"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadEpub(e.target.files[0])
                  }
                }}
              />
              <div className="dropzone-icon">🔄</div>
              <div className="dropzone-text">Drop an EPUB file to convert</div>
              <div className="dropzone-sub">Converts directly in your browser with zero server uploads</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <strong>Book:</strong> {parsedEpub.metadata.title} (by {parsedEpub.metadata.creator})
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {parsedEpub.chapters.length} chapters loaded
                  </div>
                </div>
                <button className="secondary-btn" onClick={handleClearAll}>
                  Change Book
                </button>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select Output Format:</label>
                <div className="convert-target-grid">
                  <div
                    className={`convert-target-card ${convertTarget === 'pdf' ? 'selected' : ''}`}
                    onClick={() => setConvertTarget('pdf')}
                  >
                    <div className="convert-target-badge">PDF</div>
                    <div className="convert-target-name">PDF Document (.pdf)</div>
                    <div className="convert-target-desc">A4 formatted book layout with title page &amp; chapter titles.</div>
                  </div>

                  <div
                    className={`convert-target-card ${convertTarget === 'docx' ? 'selected' : ''}`}
                    onClick={() => setConvertTarget('docx')}
                  >
                    <div className="convert-target-badge">WORD</div>
                    <div className="convert-target-name">Microsoft Word (.docx)</div>
                    <div className="convert-target-desc">Editable Word document with Georgia typography &amp; headings.</div>
                  </div>

                  <div
                    className={`convert-target-card ${convertTarget === 'md' ? 'selected' : ''}`}
                    onClick={() => setConvertTarget('md')}
                  >
                    <div className="convert-target-badge">MARKDOWN</div>
                    <div className="convert-target-name">Markdown (.md)</div>
                    <div className="convert-target-desc">Clean markdown representation for Obsidian, Notion, or GitHub.</div>
                  </div>

                  <div
                    className={`convert-target-card ${convertTarget === 'html' ? 'selected' : ''}`}
                    onClick={() => setConvertTarget('html')}
                  >
                    <div className="convert-target-badge">HTML</div>
                    <div className="convert-target-name">HTML Web Book (.html)</div>
                    <div className="convert-target-desc">Single offline web page readable in any browser.</div>
                  </div>

                  <div
                    className={`convert-target-card ${convertTarget === 'txt' ? 'selected' : ''}`}
                    onClick={() => setConvertTarget('txt')}
                  >
                    <div className="convert-target-badge">TEXT</div>
                    <div className="convert-target-name">Plain Text (.txt)</div>
                    <div className="convert-target-desc">Clean unformatted text string of all chapters.</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button className="primary-btn" disabled={isProcessing} onClick={handleConvertEpub}>
                  {isProcessing ? 'Converting...' : `Convert & Download ${convertTarget.toUpperCase()}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 3: CREATE EPUB --- */}
      {subTool === 'create' && (
        <div className="tool-panel-box">
          <h3>Create Standard EPUB E-Book</h3>
          <p className="tool-panel-desc">
            Compose chapters and build a fully valid, spec-compliant .epub book. Ready for Apple Books, Kindle, and
            e-readers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Book Title</label>
              <input
                type="text"
                className="form-control-input"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g. My Notes & Articles"
              />
            </div>

            <div className="form-group">
              <label>Author Name</label>
              <input
                type="text"
                className="form-control-input"
                value={createAuthor}
                onChange={(e) => setCreateAuthor(e.target.value)}
                placeholder="e.g. Beebek Sharma"
              />
            </div>

            <div className="form-group">
              <label>Language Code</label>
              <select
                className="form-control-select"
                value={createLanguage}
                onChange={(e) => setCreateLanguage(e.target.value)}
              >
                <option value="en">English (en)</option>
                <option value="ne">Nepali (ne)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chapters ({createChapters.length})</span>
            <button
              className="secondary-btn"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => {
                setCreateChapters([
                  ...createChapters,
                  {
                    title: `Chapter ${createChapters.length + 1}: Untitled`,
                    content: 'Write chapter content here...',
                  },
                ])
              }}
            >
              + Add Chapter
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {createChapters.map((ch, idx) => (
              <div key={idx} className="chapter-card-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control-input"
                    style={{ flex: 1, fontWeight: 600, marginRight: '1rem' }}
                    value={ch.title}
                    onChange={(e) => {
                      const updated = [...createChapters]
                      updated[idx].title = e.target.value
                      setCreateChapters(updated)
                    }}
                    placeholder="Chapter Title"
                  />
                  {createChapters.length > 1 && (
                    <button
                      className="page-btn-icon delete-btn"
                      title="Remove Chapter"
                      onClick={() => {
                        setCreateChapters(createChapters.filter((_, i) => i !== idx))
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <textarea
                  className="form-control-input"
                  rows={5}
                  style={{ fontFamily: 'Georgia, serif', lineHeight: 1.6, resize: 'vertical' }}
                  value={ch.content}
                  onChange={(e) => {
                    const updated = [...createChapters]
                    updated[idx].content = e.target.value
                    setCreateChapters(updated)
                  }}
                  placeholder="Write or paste your chapter paragraphs here..."
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="primary-btn" disabled={isProcessing} onClick={handleCreateEpub}>
              {isProcessing ? 'Packaging EPUB...' : 'Compile & Download .EPUB Book'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
