import { useCallback, useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import { downloadBlob, formatBytes, formatPercent, isAvifSupported, revokeUrl } from './toolUtils'
import './ImageCompressor.css'

export interface ProcessedImageItem {
  id: string
  file: File
  originalUrl: string
  originalSize: number
  originalWidth: number
  originalHeight: number
  outputBlob: Blob | null
  outputUrl: string | null
  outputSize: number
  outputWidth: number
  outputHeight: number
  outputFormat: string
  isProcessing: boolean
  error?: string
}

type FormatOption = 'auto' | 'image/webp' | 'image/jpeg' | 'image/png' | 'image/avif'

interface PresetConfig {
  label: string
  quality: number
  format: FormatOption
  maxWidth?: number
  maxHeight?: number
}

const PRESETS: PresetConfig[] = [
  { label: 'Max Savings', quality: 40, format: 'image/webp', maxWidth: 1280 },
  { label: 'Balanced', quality: 75, format: 'image/webp', maxWidth: 1920 },
  { label: 'High Quality', quality: 90, format: 'image/webp' },
  { label: 'Social Square', quality: 80, format: 'image/jpeg', maxWidth: 1080, maxHeight: 1080 },
]

export function ImageCompressor() {
  const [items, setItems] = useState<ProcessedImageItem[]>([])
  const [quality, setQuality] = useState<number>(75)
  const [format, setFormat] = useState<FormatOption>('image/webp')
  const [scalePercent, setScalePercent] = useState<number>(100)
  const [customWidth, setCustomWidth] = useState<string>('')
  const [customHeight, setCustomHeight] = useState<string>('')
  const [lockAspect, setLockAspect] = useState<boolean>(true)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [activePreset, setActivePreset] = useState<string>('Balanced')

  // Operations
  const [rotate, setRotate] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)
  const [flipV, setFlipV] = useState<boolean>(false)
  const [grayscale, setGrayscale] = useState<boolean>(false)
  const [brightness, setBrightness] = useState<number>(0) // -100 to 100
  const [contrast, setContrast] = useState<number>(0) // -100 to 100

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false)
  const [modalItem, setModalItem] = useState<ProcessedImageItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Check AVIF support
  const avifAvailable = isAvifSupported()

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const files: File[] = []
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const file = e.clipboardData.files[i]
        if (file.type.startsWith('image/')) {
          files.push(file)
        }
      }
      if (files.length > 0) {
        addFiles(files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // Process a single image on canvas
  const processImage = useCallback(
    async (item: ProcessedImageItem): Promise<ProcessedImageItem> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          try {
            const origW = img.naturalWidth
            const origH = img.naturalHeight

            // Calculate output width & height
            let targetW = origW
            let targetH = origH

            if (customWidth && !isNaN(Number(customWidth)) && Number(customWidth) > 0) {
              targetW = Math.round(Number(customWidth))
              targetH = lockAspect ? Math.round(targetW / (origW / origH)) : customHeight ? Number(customHeight) : origH
            } else if (customHeight && !isNaN(Number(customHeight)) && Number(customHeight) > 0) {
              targetH = Math.round(Number(customHeight))
              targetW = lockAspect ? Math.round(targetH * (origW / origH)) : origW
            } else if (scalePercent !== 100) {
              const factor = scalePercent / 100
              targetW = Math.round(origW * factor)
              targetH = Math.round(origH * factor)
            }

            // Cap dimensions to canvas limit
            targetW = Math.max(1, Math.min(8192, targetW))
            targetH = Math.max(1, Math.min(8192, targetH))

            // Canvas creation
            const canvas = document.createElement('canvas')
            const isRotated90or270 = rotate === 90 || rotate === 270
            canvas.width = isRotated90or270 ? targetH : targetW
            canvas.height = isRotated90or270 ? targetW : targetH

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve({ ...item, isProcessing: false, error: 'Canvas context unavailable' })
              return
            }

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Apply transformations
            ctx.save()
            ctx.translate(canvas.width / 2, canvas.height / 2)
            if (rotate !== 0) {
              ctx.rotate((rotate * Math.PI) / 180)
            }
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)

            // CSS Filters (brightness, contrast, grayscale)
            const filters: string[] = []
            if (grayscale) filters.push('grayscale(100%)')
            if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`)
            if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`)
            if (filters.length > 0) {
              ctx.filter = filters.join(' ')
            }

            ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH)
            ctx.restore()

            // Resolve target MIME format
            let targetMime: string = format
            if (format === 'auto') {
              targetMime = item.file.type || 'image/jpeg'
            }

            const q = quality / 100
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve({ ...item, isProcessing: false, error: 'Export failed' })
                  return
                }

                // Revoke old output URL
                revokeUrl(item.outputUrl || undefined)
                const newUrl = URL.createObjectURL(blob)

                resolve({
                  ...item,
                  outputBlob: blob,
                  outputUrl: newUrl,
                  outputSize: blob.size,
                  outputWidth: canvas.width,
                  outputHeight: canvas.height,
                  outputFormat: targetMime,
                  isProcessing: false,
                  error: undefined,
                })
              },
              targetMime,
              targetMime === 'image/png' ? undefined : q
            )
          } catch (err) {
            resolve({ ...item, isProcessing: false, error: String(err) })
          }
        }

        img.onerror = () => {
          resolve({ ...item, isProcessing: false, error: 'Failed to read image' })
        }

        img.src = item.originalUrl
      })
    },
    [quality, format, scalePercent, customWidth, customHeight, lockAspect, rotate, flipH, flipV, grayscale, brightness, contrast]
  )

  // Re-process all images when settings change
  const reprocessAll = useCallback(async () => {
    if (itemsRef.current.length === 0) return
    setIsBatchProcessing(true)

    const updated = await Promise.all(
      itemsRef.current.map(async (item) => {
        return processImage({ ...item, isProcessing: true })
      })
    )

    setItems(updated)
    setIsBatchProcessing(false)
  }, [processImage])

  // Trigger reprocess on parameter changes
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(reprocessAll, 120)
      return () => clearTimeout(timer)
    }
  }, [reprocessAll])

  // Add new files to batch
  const addFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((f) => f.type.startsWith('image/'))
      if (validFiles.length === 0) return

      const newItems: ProcessedImageItem[] = []

      for (const file of validFiles) {
        const originalUrl = URL.createObjectURL(file)
        const item: ProcessedImageItem = {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          originalUrl,
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          outputBlob: null,
          outputUrl: null,
          outputSize: 0,
          outputWidth: 0,
          outputHeight: 0,
          outputFormat: format,
          isProcessing: true,
        }

        // Read dimensions first
        await new Promise<void>((res) => {
          const img = new Image()
          img.onload = () => {
            item.originalWidth = img.naturalWidth
            item.originalHeight = img.naturalHeight
            setAspectRatio(img.naturalWidth / img.naturalHeight)
            res()
          }
          img.onerror = () => res()
          img.src = originalUrl
        })

        const processed = await processImage(item)
        newItems.push(processed)
      }

      setItems((prev) => [...prev, ...newItems])
    },
    [format, processImage]
  )

  // Apply Preset
  const handleSelectPreset = (preset: PresetConfig) => {
    setActivePreset(preset.label)
    setQuality(preset.quality)
    setFormat(preset.format)
    if (preset.maxWidth) {
      setCustomWidth(String(preset.maxWidth))
    } else {
      setCustomWidth('')
    }
    if (preset.maxHeight) {
      setCustomHeight(String(preset.maxHeight))
    } else {
      setCustomHeight('')
    }
  }

  // Clear all files & free memory
  const handleClearAll = () => {
    items.forEach((item) => {
      revokeUrl(item.originalUrl)
      revokeUrl(item.outputUrl || undefined)
    })
    setItems([])
    setModalItem(null)
  }

  // Remove single item
  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      revokeUrl(item.originalUrl)
      revokeUrl(item.outputUrl || undefined)
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (modalItem?.id === id) setModalItem(null)
  }

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (items.length === 0) return
    const zip = new JSZip()
    const folder = zip.folder('compressed-images')

    items.forEach((item, index) => {
      if (item.outputBlob) {
        const ext =
          item.outputFormat === 'image/webp'
            ? 'webp'
            : item.outputFormat === 'image/png'
              ? 'png'
              : item.outputFormat === 'image/avif'
                ? 'avif'
                : 'jpg'
        const base = item.file.name.replace(/\.[^/.]+$/, '')
        const filename = `${base}_compressed.${ext}`
        folder?.file(filename, item.outputBlob)
      }
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, 'compressed_images.zip')
  }

  // Compute batch statistics
  const totalOriginalSize = items.reduce((acc, curr) => acc + curr.originalSize, 0)
  const totalOutputSize = items.reduce((acc, curr) => acc + (curr.outputSize || curr.originalSize), 0)
  const batchStats = formatPercent(totalOriginalSize, totalOutputSize)

  return (
    <div className="tool-view">
      {/* Tool Header */}
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>Image Compressor &amp; Resizer</h2>
          <p>
            Lossless and adaptive browser compression. Process photos, screenshots, and web graphics locally with zero server
            uploads.
          </p>
        </div>
        <div className="tool-header-actions">
          {items.length > 0 && (
            <button type="button" className="button" onClick={handleClearAll} style={{ padding: '0.5rem 1rem' }}>
              🧹 Clear All ({items.length})
            </button>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files))
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="drop-title">Drop images here or click to browse</div>
        <div className="drop-subtitle">Supports multiple files &amp; paste from clipboard (Ctrl+V)</div>
        <div className="drop-pills">
          <span className="drop-pill">JPG</span>
          <span className="drop-pill">PNG</span>
          <span className="drop-pill">WebP</span>
          {avifAvailable && <span className="drop-pill">AVIF</span>}
          <span className="drop-pill">BMP</span>
          <span className="drop-pill">GIF</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) {
              addFiles(Array.from(e.target.files))
            }
          }}
        />
      </div>

      {/* Main Settings & Results Layout */}
      {items.length > 0 && (
        <div className="compressor-grid">
          {/* Left Settings Panel */}
          <div className="settings-panel">
            {/* Presets */}
            <div className="control-group">
              <span className="settings-section-title">Presets</span>
              <div className="presets-grid">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`preset-chip ${activePreset === preset.label ? 'is-active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="control-group">
              <div className="control-label-row">
                <span>Compression Quality</span>
                <span className="control-value-badge">{quality}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={quality}
                className="tool-slider"
                onChange={(e) => {
                  setQuality(Number(e.target.value))
                  setActivePreset('Custom')
                }}
              />
            </div>

            {/* Format Selection */}
            <div className="control-group">
              <span className="settings-section-title">Output Format</span>
              <div className="format-buttons-row">
                <button
                  type="button"
                  className={`format-btn ${format === 'auto' ? 'is-active' : ''}`}
                  onClick={() => setFormat('auto')}
                >
                  Auto
                </button>
                <button
                  type="button"
                  className={`format-btn ${format === 'image/webp' ? 'is-active' : ''}`}
                  onClick={() => setFormat('image/webp')}
                >
                  WebP
                </button>
                <button
                  type="button"
                  className={`format-btn ${format === 'image/jpeg' ? 'is-active' : ''}`}
                  onClick={() => setFormat('image/jpeg')}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  className={`format-btn ${format === 'image/png' ? 'is-active' : ''}`}
                  onClick={() => setFormat('image/png')}
                >
                  PNG
                </button>
                {avifAvailable && (
                  <button
                    type="button"
                    className={`format-btn ${format === 'image/avif' ? 'is-active' : ''}`}
                    onClick={() => setFormat('image/avif')}
                  >
                    AVIF
                  </button>
                )}
              </div>
            </div>

            {/* Resize & Dimensions */}
            <div className="control-group">
              <span className="settings-section-title">Resize &amp; Scale</span>
              <div className="format-buttons-row">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className={`format-btn ${scalePercent === pct && !customWidth && !customHeight ? 'is-active' : ''}`}
                    onClick={() => {
                      setScalePercent(pct)
                      setCustomWidth('')
                      setCustomHeight('')
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="dimensions-row" style={{ marginTop: '0.4rem' }}>
                <div className="dim-input-box">
                  <span className="dim-prefix">W</span>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={customWidth}
                    className="dim-input"
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomWidth(val)
                      if (lockAspect && val && Number(val) > 0 && aspectRatio > 0) {
                        setCustomHeight(String(Math.round(Number(val) / aspectRatio)))
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={`dim-lock-btn ${lockAspect ? 'is-locked' : ''}`}
                  title={lockAspect ? 'Aspect ratio locked' : 'Unlock aspect ratio'}
                  onClick={() => setLockAspect(!lockAspect)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {lockAspect ? (
                      <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </>
                    ) : (
                      <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </>
                    )}
                  </svg>
                </button>
                <div className="dim-input-box">
                  <span className="dim-prefix">H</span>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={customHeight}
                    className="dim-input"
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomHeight(val)
                      if (lockAspect && val && Number(val) > 0 && aspectRatio > 0) {
                        setCustomWidth(String(Math.round(Number(val) * aspectRatio)))
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Adjustments: Rotate & Flip & Filter */}
            <div className="control-group">
              <span className="settings-section-title">Operations</span>
              <div className="ops-button-group">
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => setRotate((r) => (r + 90) % 360)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>{rotate}° Rotate</span>
                </button>
                <button
                  type="button"
                  className={`op-btn ${flipH ? 'is-active' : ''}`}
                  onClick={() => setFlipH(!flipH)}
                >
                  <span>⇄ Flip H</span>
                </button>
                <button
                  type="button"
                  className={`op-btn ${flipV ? 'is-active' : ''}`}
                  onClick={() => setFlipV(!flipV)}
                >
                  <span>⇅ Flip V</span>
                </button>
                <button
                  type="button"
                  className={`op-btn ${grayscale ? 'is-active' : ''}`}
                  onClick={() => setGrayscale(!grayscale)}
                >
                  <span>B&amp;W</span>
                </button>
              </div>

              {/* Brightness & Contrast */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                <div className="control-label-row">
                  <span>Brightness</span>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    {brightness > 0 ? `+${brightness}` : brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  className="tool-slider"
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />

                <div className="control-label-row">
                  <span>Contrast</span>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
                    {contrast > 0 ? `+${contrast}` : contrast}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  className="tool-slider"
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Right Results / Batch List Panel */}
          <div className="results-panel">
            {/* Batch Action Bar */}
            <div className="batch-action-bar">
              <div className="batch-summary">
                <span>{items.length} {items.length === 1 ? 'file' : 'files'}</span>
                <span>•</span>
                <span>{formatBytes(totalOriginalSize)} → {formatBytes(totalOutputSize)}</span>
                <span className="batch-saved-highlight">
                  {batchStats.text} saved
                </span>
              </div>
              <div className="batch-buttons">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleDownloadZip}
                  disabled={isBatchProcessing}
                  style={{ padding: '0.55rem 1.15rem' }}
                >
                  <span>Download All as ZIP</span>
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            </div>

            {/* List of processed images */}
            <div className="image-items-list">
              {items.map((item) => {
                const stats = formatPercent(item.originalSize, item.outputSize)
                const ext =
                  item.outputFormat === 'image/webp'
                    ? 'webp'
                    : item.outputFormat === 'image/png'
                      ? 'png'
                      : item.outputFormat === 'image/avif'
                        ? 'avif'
                        : 'jpg'
                const downloadName = `${item.file.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}`

                return (
                  <div key={item.id} className="image-card-item">
                    {/* Thumbnail with compare click */}
                    <div
                      className="image-thumb-wrap"
                      onClick={() => setModalItem(item)}
                      title="Click to compare before & after"
                    >
                      <img src={item.outputUrl || item.originalUrl} alt={item.file.name} />
                      <div className="image-thumb-zoom-hint">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="image-card-meta">
                      <div className="image-card-name" title={item.file.name}>
                        {item.file.name}
                      </div>
                      <div className="image-card-stats">
                        <span>{formatBytes(item.originalSize)} ({item.originalWidth}×{item.originalHeight})</span>
                        <span className="stat-arrow">→</span>
                        <span>{formatBytes(item.outputSize)} ({item.outputWidth}×{item.outputHeight})</span>
                        <span className={`stat-diff-badge ${stats.isSaved ? 'is-saved' : 'is-increased'}`}>
                          {stats.text}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="image-card-actions">
                      {item.outputBlob && (
                        <button
                          type="button"
                          className="button"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                          onClick={() => downloadBlob(item.outputBlob!, downloadName)}
                        >
                          Download
                        </button>
                      )}
                      <button
                        type="button"
                        className="button"
                        style={{ padding: '0.45rem 0.65rem', color: 'var(--muted)' }}
                        title="Remove file"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {modalItem && (
        <div className="comparison-modal-backdrop" onClick={() => setModalItem(null)}>
          <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                Inspection // {modalItem.file.name}
              </span>
              <button
                type="button"
                className="button"
                style={{ padding: '0.3rem 0.6rem' }}
                onClick={() => setModalItem(null)}
              >
                ✕ Close
              </button>
            </div>
            <div className="modal-body">
              <div className="compare-panes-row">
                <div className="compare-pane">
                  <div className="compare-pane-header">
                    <span style={{ color: 'var(--muted)' }}>ORIGINAL</span>
                    <span>{formatBytes(modalItem.originalSize)} • {modalItem.originalWidth}×{modalItem.originalHeight}px</span>
                  </div>
                  <div className="compare-image-box">
                    <img src={modalItem.originalUrl} alt="Original" />
                  </div>
                </div>
                <div className="compare-pane">
                  <div className="compare-pane-header">
                    <span style={{ color: 'var(--accent-bright)' }}>COMPRESSED ({modalItem.outputFormat.split('/')[1]?.toUpperCase()})</span>
                    <span>{formatBytes(modalItem.outputSize)} • {modalItem.outputWidth}×{modalItem.outputHeight}px</span>
                  </div>
                  <div className="compare-image-box">
                    <img src={modalItem.outputUrl || modalItem.originalUrl} alt="Compressed" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
