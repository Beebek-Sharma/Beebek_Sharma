import { useState } from 'react'

type DocSubTool = 'json' | 'csv' | 'markdown' | 'text-stats'

export function DocumentTools() {
  const [subTool, setSubTool] = useState<DocSubTool>('json')

  // JSON State
  const [jsonInput, setJsonInput] = useState<string>('{\n  "status": "success",\n  "code": 200,\n  "data": {\n    "message": "Processed client-side in browser",\n    "local": true\n  }\n}')
  const [jsonError, setJsonError] = useState<string>('')

  // CSV State
  const [csvInput, setCsvInput] = useState<string>('id,name,role,location\n1,Beebek Sharma,AI & Backend Engineer,Nepal\n2,Ada Lovelace,Computing Pioneer,UK\n3,Alan Turing,Computer Scientist,UK')
  const [csvOutput, setCsvOutput] = useState<string>('')

  // Markdown State
  const [markdownInput, setMarkdownInput] = useState<string>('# Client-Side Processing\n\n- **Zero** external uploads\n- **100%** browser execution\n\n```json\n{"privacy": "guaranteed"}\n```')

  // Text Stats State
  const [textStatsInput, setTextStatsInput] = useState<string>('Computers are like bicycles for our minds. We build software to empower people and solve real problems.')

  // JSON Actions
  const handleFormatJson = (spaces = 2) => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, spaces))
      setJsonError('')
    } catch (err) {
      setJsonError(String(err))
    }
  }

  const handleMinifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed))
      setJsonError('')
    } catch (err) {
      setJsonError(String(err))
    }
  }

  // CSV to JSON Action
  const handleCsvToJson = () => {
    try {
      const lines = csvInput.trim().split('\n')
      if (lines.length < 2) return
      const headers = lines[0].split(',').map((h) => h.trim())
      const result = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h] = values[i] || ''
        })
        return obj
      })
      setCsvOutput(JSON.stringify(result, null, 2))
    } catch (err) {
      setCsvOutput(`Error parsing CSV: ${String(err)}`)
    }
  }

  // Simple Markdown renderer
  const renderSimpleMarkdown = (md: string) => {
    return md
      .replace(/^# (.*$)/gim, '<h3 style="margin: 0.5rem 0; font-size: 1.3rem;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h4 style="margin: 0.5rem 0; font-size: 1.1rem;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code style="background: rgba(91,156,130,0.15); padding: 0.1rem 0.3rem; border-radius: 4px; font-family: var(--mono); font-size: 0.85em;">$1</code>')
      .replace(/\n$/gim, '<br />')
  }

  // Text Stats Computation
  const wordsCount = textStatsInput.trim() ? textStatsInput.trim().split(/\s+/).length : 0
  const charCount = textStatsInput.length
  const charNoSpaces = textStatsInput.replace(/\s+/g, '').length
  const linesCount = textStatsInput ? textStatsInput.split('\n').length : 0
  const readingTime = Math.ceil(wordsCount / 200)

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>Document &amp; Text Tools</h2>
          <p>Format, convert, and inspect structured data and text directly in your browser without telemetry or leaking data.</p>
        </div>

        <div className="format-buttons-row">
          <button
            type="button"
            className={`format-btn ${subTool === 'json' ? 'is-active' : ''}`}
            onClick={() => setSubTool('json')}
          >
            JSON Formatter
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'csv' ? 'is-active' : ''}`}
            onClick={() => {
              setSubTool('csv')
              handleCsvToJson()
            }}
          >
            CSV ↔ JSON
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'markdown' ? 'is-active' : ''}`}
            onClick={() => setSubTool('markdown')}
          >
            Markdown Preview
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'text-stats' ? 'is-active' : ''}`}
            onClick={() => setSubTool('text-stats')}
          >
            Text Inspector
          </button>
        </div>
      </div>

      {/* JSON Formatter */}
      {subTool === 'json' && (
        <div className="compressor-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="settings-section-title">JSON Editor</span>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button type="button" className="op-btn" onClick={() => handleFormatJson(2)}>
                  Format (2 Spaces)
                </button>
                <button type="button" className="op-btn" onClick={() => handleFormatJson(4)}>
                  Format (4 Spaces)
                </button>
                <button type="button" className="op-btn" onClick={handleMinifyJson}>
                  Minify
                </button>
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => navigator.clipboard.writeText(jsonInput)}
                >
                  Copy
                </button>
              </div>
            </div>

            <textarea
              value={jsonInput}
              rows={14}
              onChange={(e) => setJsonInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            {jsonError && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', fontFamily: 'var(--mono)' }}>
                ✕ Syntax Error: {jsonError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV to JSON */}
      {subTool === 'csv' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">CSV Input</span>
            <textarea
              value={csvInput}
              rows={12}
              onChange={(e) => setCsvInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <button
              type="button"
              className="button button-primary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleCsvToJson}
            >
              Convert to JSON
            </button>
          </div>

          <div className="settings-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="settings-section-title">JSON Result</span>
              <button
                type="button"
                className="op-btn"
                onClick={() => navigator.clipboard.writeText(csvOutput)}
              >
                Copy JSON
              </button>
            </div>
            <textarea
              value={csvOutput}
              rows={12}
              readOnly
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                color: 'var(--accent-bright)',
                fontFamily: 'var(--mono)',
                fontSize: '0.82rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Markdown Preview */}
      {subTool === 'markdown' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Markdown Source</span>
            <textarea
              value={markdownInput}
              rows={14}
              onChange={(e) => setMarkdownInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="settings-panel">
            <span className="settings-section-title">Live Render</span>
            <div
              dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(markdownInput) }}
              style={{
                minHeight: '260px',
                background: 'var(--surface-2)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                lineHeight: 1.6,
                fontSize: '0.92rem',
              }}
            />
          </div>
        </div>
      )}

      {/* Text Inspector */}
      {subTool === 'text-stats' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Input Text</span>
            <textarea
              value={textStatsInput}
              rows={10}
              onChange={(e) => setTextStatsInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                fontSize: '0.88rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                outline: 'none',
              }}
            />

            {/* Case transformers */}
            <div className="control-group" style={{ marginTop: '0.5rem' }}>
              <span className="control-label-row">Transform Case</span>
              <div className="ops-button-group">
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => setTextStatsInput(textStatsInput.toUpperCase())}
                >
                  UPPERCASE
                </button>
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => setTextStatsInput(textStatsInput.toLowerCase())}
                >
                  lowercase
                </button>
                <button
                  type="button"
                  className="op-btn"
                  onClick={() =>
                    setTextStatsInput(
                      textStatsInput.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
                    )
                  }
                >
                  Title Case
                </button>
                <button
                  type="button"
                  className="op-btn"
                  onClick={() =>
                    setTextStatsInput(
                      textStatsInput
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_-]+/g, '-')
                    )
                  }
                >
                  kebab-case
                </button>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <span className="settings-section-title">Text Metrics</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-bright)' }}>{wordsCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Words
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>{charCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Characters
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>{charNoSpaces}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Chars (No Space)
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>{readingTime}m</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>
                  Reading Time
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
