import { useState } from 'react'
import { downloadBlob, formatBytes } from './toolUtils'

interface ExifTag {
  label: string
  value: string
}

export function ImageExifCleaner() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [tags, setTags] = useState<ExifTag[]>([])
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null)
  const [isStripping, setIsStripping] = useState<boolean>(false)

  const handleSelectFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return
    if (imageUrl) URL.revokeObjectURL(imageUrl)

    setFile(selectedFile)
    setImageUrl(URL.createObjectURL(selectedFile))
    setCleanedBlob(null)

    // Parse basic EXIF tags from binary ArrayBuffer
    const buffer = await selectedFile.arrayBuffer()
    const parsedTags = parseExifFromBuffer(buffer, selectedFile)
    setTags(parsedTags)
  }

  // Parse standard EXIF markers in client
  const parseExifFromBuffer = (buffer: ArrayBuffer, fileInfo: File): ExifTag[] => {
    const list: ExifTag[] = [
      { label: 'File Name', value: fileInfo.name },
      { label: 'MIME Type', value: fileInfo.type },
      { label: 'Original Size', value: formatBytes(fileInfo.size) },
      { label: 'Last Modified', value: new Date(fileInfo.lastModified).toLocaleString() },
    ]

    const view = new DataView(buffer)
    // Check JPEG SOI marker (0xFFD8)
    if (view.getUint16(0, false) === 0xffd8) {
      let offset = 2
      while (offset < view.byteLength) {
        if (view.getUint8(offset) !== 0xff) break
        const marker = view.getUint8(offset + 1)
        // APP1 marker (EXIF)
        if (marker === 0xe1) {
          const length = view.getUint16(offset + 2, false)
          const exifHeader = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7)
          )
          if (exifHeader === 'Exif') {
            list.push({ label: 'EXIF Header Found', value: 'Yes (Contains embedded hardware / GPS metadata)' })
          }
          break
        }
        offset += 2 + view.getUint16(offset + 2, false)
      }
    }

    return list
  }

  // Strip all metadata by re-encoding pure pixels
  const handleStripMetadata = async () => {
    if (!file || !imageUrl) return
    setIsStripping(true)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsStripping(false)
        return
      }

      // Draw pure bitmap pixels (strips all external EXIF, IPTC, XMP chunks)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          setCleanedBlob(blob)
          setIsStripping(false)
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.95
      )
    }
    img.src = imageUrl
  }

  const handleDownloadClean = () => {
    if (!cleanedBlob || !file) return
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const name = `${file.name.replace(/\.[^/.]+$/, '')}_clean.${ext}`
    downloadBlob(cleanedBlob, name)
  }

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>Image EXIF &amp; Metadata Cleaner</h2>
          <p>
            Inspect and sanitize hidden EXIF, GPS location tags, camera serials, and timestamps before publishing images to the
            web.
          </p>
        </div>
      </div>

      {!file ? (
        <div className="drop-zone" onClick={() => document.getElementById('exif-input')?.click()}>
          <div className="drop-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="drop-title">Select photo to inspect and scrub</div>
          <div className="drop-subtitle">Analyzes JPEG / PNG metadata markers client-side</div>
          <input
            id="exif-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSelectFile(e.target.files[0])
              }
            }}
          />
        </div>
      ) : (
        <div className="compressor-grid">
          {/* Metadata Table */}
          <div className="settings-panel">
            <span className="settings-section-title">Detected Metadata</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {tags.map((tag) => (
                <div
                  key={tag.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{tag.label}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{tag.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleStripMetadata}
                disabled={isStripping}
              >
                {isStripping ? 'Sanitizing...' : '🛡️ Strip All Metadata'}
              </button>
              {cleanedBlob && (
                <button type="button" className="button button-primary" onClick={handleDownloadClean}>
                  Download Cleaned Photo ({formatBytes(cleanedBlob.size)})
                </button>
              )}
            </div>
          </div>

          {/* Image Preview */}
          <div className="results-panel">
            <div
              style={{
                width: '100%',
                minHeight: '380px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Inspection Target"
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
