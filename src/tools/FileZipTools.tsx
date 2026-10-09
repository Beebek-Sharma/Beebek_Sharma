import { useState } from 'react'
import JSZip from 'jszip'
import { computeFileHash, downloadBlob, formatBytes } from './toolUtils'

type FileSubTool = 'hasher' | 'renamer' | 'zip-creator' | 'zip-extractor'

interface InspectedFile {
  name: string
  size: number
  type: string
  sha256: string
  sha1: string
}

export function FileZipTools() {
  const [subTool, setSubTool] = useState<FileSubTool>('hasher')

  // Hash state
  const [inspectedFile, setInspectedFile] = useState<InspectedFile | null>(null)
  const [isHashing, setIsHashing] = useState<boolean>(false)

  // Renamer state
  const [renameFiles, setRenameFiles] = useState<File[]>([])
  const [renamePrefix, setRenamePrefix] = useState<string>('')
  const [renameSuffix, setRenameSuffix] = useState<string>('')
  const [findText, setFindText] = useState<string>('')
  const [replaceText, setReplaceText] = useState<string>('')
  const [numbering, setNumbering] = useState<boolean>(false)
  const [toLower, setToLower] = useState<boolean>(false)
  const [replaceSpacesWithUnderscore, setReplaceSpacesWithUnderscore] = useState<boolean>(false)

  // ZIP Creator state
  const [zipFiles, setZipFiles] = useState<File[]>([])
  const [archiveName, setArchiveName] = useState<string>('bundle.zip')

  // ZIP Extractor state
  const [extractedEntries, setExtractedEntries] = useState<{ name: string; size: number; fileObj: JSZip.JSZipObject }[]>([])

  // 1. File Inspection & Hashing
  const handleInspectFile = async (file: File) => {
    setIsHashing(true)
    const [sha256, sha1] = await Promise.all([
      computeFileHash(file, 'SHA-256'),
      computeFileHash(file, 'SHA-1'),
    ])

    setInspectedFile({
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown / Binary',
      sha256,
      sha1,
    })
    setIsHashing(false)
  }

  // 2. Batch Renamer Compute
  const computeNewName = (originalName: string, index: number): string => {
    const extIndex = originalName.lastIndexOf('.')
    let base = extIndex !== -1 ? originalName.slice(0, extIndex) : originalName
    const ext = extIndex !== -1 ? originalName.slice(extIndex) : ''

    if (findText) {
      base = base.replaceAll(findText, replaceText)
    }
    if (replaceSpacesWithUnderscore) {
      base = base.replace(/\s+/g, '_')
    }
    if (toLower) {
      base = base.toLowerCase()
    }
    if (numbering) {
      const num = String(index + 1).padStart(2, '0')
      base = `${base}_${num}`
    }

    return `${renamePrefix}${base}${renameSuffix}${ext}`
  }

  const handleDownloadRenamedZip = async () => {
    if (renameFiles.length === 0) return
    const zip = new JSZip()
    renameFiles.forEach((file, index) => {
      const newName = computeNewName(file.name, index)
      zip.file(newName, file)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'renamed_files.zip')
  }

  // 3. ZIP Creator Action
  const handleCreateZip = async () => {
    if (zipFiles.length === 0) return
    const zip = new JSZip()
    zipFiles.forEach((file) => zip.file(file.name, file))
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`)
  }

  // 4. ZIP Extractor Action
  const handleInspectZip = async (zipFile: File) => {
    const zip = await JSZip.loadAsync(zipFile)
    const entries: { name: string; size: number; fileObj: JSZip.JSZipObject }[] = []

    zip.forEach((path, entry) => {
      if (!entry.dir) {
        // @ts-expect-error JSZip internal metadata
        const uncompressedSize = entry._data?.uncompressedSize || 0
        entries.push({
          name: path,
          size: uncompressedSize,
          fileObj: entry,
        })
      }
    })

    setExtractedEntries(entries)
  }

  const handleDownloadZipEntry = async (entry: JSZip.JSZipObject, name: string) => {
    const blob = await entry.async('blob')
    downloadBlob(blob, name.split('/').pop() || name)
  }

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>File &amp; ZIP Utilities</h2>
          <p>Inspect cryptographic file signatures (SHA-256), batch rename file sets, and create/extract ZIP archives locally.</p>
        </div>

        <div className="format-buttons-row">
          <button
            type="button"
            className={`format-btn ${subTool === 'hasher' ? 'is-active' : ''}`}
            onClick={() => setSubTool('hasher')}
          >
            File Inspector &amp; Hash
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'renamer' ? 'is-active' : ''}`}
            onClick={() => setSubTool('renamer')}
          >
            Batch Renamer
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'zip-creator' ? 'is-active' : ''}`}
            onClick={() => setSubTool('zip-creator')}
          >
            ZIP Creator
          </button>
          <button
            type="button"
            className={`format-btn ${subTool === 'zip-extractor' ? 'is-active' : ''}`}
            onClick={() => setSubTool('zip-extractor')}
          >
            ZIP Extractor
          </button>
        </div>
      </div>

      {/* 1. Hasher */}
      {subTool === 'hasher' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Cryptographic Hash Inspector</span>
            {inspectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>FILE NAME</div>
                  <div style={{ fontWeight: 600 }}>{inspectedFile.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>EXACT SIZE</div>
                  <div>{formatBytes(inspectedFile.size)} ({inspectedFile.size.toLocaleString()} bytes)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>MIME TYPE</div>
                  <div>{inspectedFile.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-bright)', fontFamily: 'var(--mono)' }}>SHA-256 CHECKSUM</div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '0.76rem',
                      background: 'var(--surface-2)',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      wordBreak: 'break-all',
                      color: 'var(--text)',
                      marginTop: '0.2rem',
                    }}
                  >
                    {inspectedFile.sha256}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>SHA-1 CHECKSUM</div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '0.76rem',
                      background: 'var(--surface-2)',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      wordBreak: 'break-all',
                      color: 'var(--text)',
                      marginTop: '0.2rem',
                    }}
                  >
                    {inspectedFile.sha1}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                Select any file to generate its cryptographic SHA-256 and SHA-1 signatures directly via Web Crypto API.
              </div>
            )}
          </div>

          <div className="results-panel">
            <div className="drop-zone" onClick={() => document.getElementById('hash-file-input')?.click()}>
              <div className="drop-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="drop-title">Select any file to verify checksum</div>
              <div className="drop-subtitle">{isHashing ? 'Computing hash...' : 'Calculated locally via crypto.subtle'}</div>
              <input
                id="hash-file-input"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleInspectFile(e.target.files[0])
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Batch Renamer */}
      {subTool === 'renamer' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Renaming Rules</span>
            <div className="control-group">
              <span className="control-label-row">Prefix</span>
              <input
                type="text"
                placeholder="e.g. project_"
                className="dim-input"
                value={renamePrefix}
                style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: '6px' }}
                onChange={(e) => setRenamePrefix(e.target.value)}
              />
            </div>

            <div className="control-group">
              <span className="control-label-row">Suffix</span>
              <input
                type="text"
                placeholder="e.g. _v2"
                className="dim-input"
                value={renameSuffix}
                style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: '6px' }}
                onChange={(e) => setRenameSuffix(e.target.value)}
              />
            </div>

            <div className="control-group">
              <span className="control-label-row">Find &amp; Replace</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Find"
                  className="dim-input"
                  value={findText}
                  style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: '6px' }}
                  onChange={(e) => setFindText(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Replace"
                  className="dim-input"
                  value={replaceText}
                  style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: '6px' }}
                  onChange={(e) => setReplaceText(e.target.value)}
                />
              </div>
            </div>

            <div className="ops-button-group" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className={`op-btn ${numbering ? 'is-active' : ''}`}
                onClick={() => setNumbering(!numbering)}
              >
                + Numbering (_01)
              </button>
              <button
                type="button"
                className={`op-btn ${toLower ? 'is-active' : ''}`}
                onClick={() => setToLower(!toLower)}
              >
                lowercase
              </button>
              <button
                type="button"
                className={`op-btn ${replaceSpacesWithUnderscore ? 'is-active' : ''}`}
                onClick={() => setReplaceSpacesWithUnderscore(!replaceSpacesWithUnderscore)}
              >
                Spaces → _
              </button>
            </div>

            <button
              type="button"
              className="button button-primary"
              style={{ marginTop: '1rem' }}
              disabled={renameFiles.length === 0}
              onClick={handleDownloadRenamedZip}
            >
              Download Renamed Archive (ZIP)
            </button>
          </div>

          <div className="results-panel">
            <div className="drop-zone" onClick={() => document.getElementById('rename-file-input')?.click()}>
              <div className="drop-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div className="drop-title">Select files to rename</div>
              <div className="drop-subtitle">{renameFiles.length} files selected</div>
              <input
                id="rename-file-input"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) setRenameFiles(Array.from(e.target.files))
                }}
              />
            </div>

            {renameFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '1rem' }}>
                {renameFiles.slice(0, 10).map((file, i) => (
                  <div
                    key={file.name + i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>{file.name}</span>
                    <span style={{ color: 'var(--faint)' }}>→</span>
                    <span style={{ color: 'var(--accent-bright)' }}>{computeNewName(file.name, i)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ZIP Creator */}
      {subTool === 'zip-creator' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Archive Settings</span>
            <div className="control-group">
              <span className="control-label-row">Archive Name</span>
              <input
                type="text"
                value={archiveName}
                className="dim-input"
                style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: '6px' }}
                onChange={(e) => setArchiveName(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="button button-primary"
              style={{ marginTop: '1rem' }}
              disabled={zipFiles.length === 0}
              onClick={handleCreateZip}
            >
              Bundle &amp; Download ZIP ({zipFiles.length} files)
            </button>
          </div>

          <div className="results-panel">
            <div className="drop-zone" onClick={() => document.getElementById('zip-create-input')?.click()}>
              <div className="drop-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div className="drop-title">Select files to pack into ZIP</div>
              <div className="drop-subtitle">{zipFiles.length} files chosen</div>
              <input
                id="zip-create-input"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) setZipFiles(Array.from(e.target.files))
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. ZIP Extractor */}
      {subTool === 'zip-extractor' && (
        <div className="compressor-grid">
          <div className="settings-panel">
            <span className="settings-section-title">Archive Contents ({extractedEntries.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '420px', overflowY: 'auto' }}>
              {extractedEntries.map((entry) => (
                <div
                  key={entry.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    {entry.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--muted)' }}>{formatBytes(entry.size)}</span>
                    <button
                      type="button"
                      className="button"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem' }}
                      onClick={() => handleDownloadZipEntry(entry.fileObj, entry.name)}
                    >
                      Extract
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="results-panel">
            <div className="drop-zone" onClick={() => document.getElementById('zip-extract-input')?.click()}>
              <div className="drop-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
              </div>
              <div className="drop-title">Select a ZIP archive to inspect and extract</div>
              <div className="drop-subtitle">Inspects and extracts contents 100% in-browser</div>
              <input
                id="zip-extract-input"
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleInspectZip(e.target.files[0])
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
