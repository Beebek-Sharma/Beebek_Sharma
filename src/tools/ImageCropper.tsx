import { useEffect, useRef, useState } from 'react'
import { downloadBlob, formatBytes } from './toolUtils'

type AspectRatioOption = 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2'

export function ImageCropper() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('1:1')
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [cropFormat, setCropFormat] = useState<'image/webp' | 'image/png' | 'image/jpeg'>('image/webp')
  const [cropQuality, setCropQuality] = useState<number>(85)

  // Crop Coordinates in normalized 0..1 scale or pixel scale
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  })

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Clean URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [imageUrl, previewUrl])

  const handleSelectFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    const url = URL.createObjectURL(file)
    setImageFile(file)
    setImageUrl(url)
    setZoom(1)
    setRotation(0)
    setCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
  }

  // Generate cropped result
  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.onload = () => {
      const origW = img.naturalWidth
      const origH = img.naturalHeight

      // Calculate pixel crop coordinates
      let cropW = origW * cropRect.width
      let cropH = origH * cropRect.height

      // Enforce aspect ratio if set
      if (aspectRatio === '1:1') {
        const side = Math.min(cropW, cropH)
        cropW = side
        cropH = side
      } else if (aspectRatio === '16:9') {
        cropH = cropW * (9 / 16)
      } else if (aspectRatio === '9:16') {
        cropW = cropH * (9 / 16)
      } else if (aspectRatio === '4:3') {
        cropH = cropW * (3 / 4)
      } else if (aspectRatio === '3:2') {
        cropH = cropW * (2 / 3)
      }

      const cropX = Math.max(0, Math.min(origW - cropW, origW * cropRect.x))
      const cropY = Math.max(0, Math.min(origH - cropH, origH * cropRect.y))

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(cropW))
      canvas.height = Math.max(1, Math.round(cropH))

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Transformations
      ctx.save()
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.drawImage(img, cropX, cropY, cropW, cropH, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
      } else {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)
      }
      ctx.restore()

      canvas.toBlob(
        (blob) => {
          if (!blob) return
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          const newUrl = URL.createObjectURL(blob)
          setPreviewBlob(blob)
          setPreviewUrl(newUrl)
          setPreviewDimensions({ width: canvas.width, height: canvas.height })
        },
        cropFormat,
        cropFormat === 'image/png' ? undefined : cropQuality / 100
      )
    }
    img.src = imageUrl
  }, [imageUrl, cropRect, aspectRatio, rotation, cropFormat, cropQuality])

  const handleDownloadCropped = () => {
    if (!previewBlob || !imageFile) return
    const ext = cropFormat === 'image/webp' ? 'webp' : cropFormat === 'image/png' ? 'png' : 'jpg'
    const name = `${imageFile.name.replace(/\.[^/.]+$/, '')}_cropped.${ext}`
    downloadBlob(previewBlob, name)
  }

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>Image Cropper &amp; Aspect Tool</h2>
          <p>Crop images to exact dimensions or social media aspect ratios (1:1, 16:9, 9:16) with zero pixel degradation.</p>
        </div>
        {imageFile && (
          <div className="tool-header-actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                setImageFile(null)
                setImageUrl(null)
                setPreviewBlob(null)
              }}
            >
              Clear Image
            </button>
          </div>
        )}
      </div>

      {!imageFile ? (
        <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
          <div className="drop-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </div>
          <div className="drop-title">Select an image to crop</div>
          <div className="drop-subtitle">Supports JPG, PNG, and WebP</div>
          <input
            ref={fileInputRef}
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
          {/* Controls Panel */}
          <div className="settings-panel">
            <div className="control-group">
              <span className="settings-section-title">Aspect Ratio</span>
              <div className="format-buttons-row">
                {(['free', '1:1', '16:9', '9:16', '4:3', '3:2'] as AspectRatioOption[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    className={`format-btn ${aspectRatio === ratio ? 'is-active' : ''}`}
                    onClick={() => setAspectRatio(ratio)}
                  >
                    {ratio === 'free' ? 'Free' : ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="settings-section-title">Crop Position</span>
              <div className="dimensions-row">
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCropRect({ x: 0, y: 0, width: 1, height: 1 })}
                >
                  Full Frame
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCropRect({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 })}
                >
                  Center (70%)
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCropRect({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 })}
                >
                  Close-up (50%)
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="settings-section-title">Export Settings</span>
              <div className="format-buttons-row">
                <button
                  type="button"
                  className={`format-btn ${cropFormat === 'image/webp' ? 'is-active' : ''}`}
                  onClick={() => setCropFormat('image/webp')}
                >
                  WebP
                </button>
                <button
                  type="button"
                  className={`format-btn ${cropFormat === 'image/jpeg' ? 'is-active' : ''}`}
                  onClick={() => setCropFormat('image/jpeg')}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  className={`format-btn ${cropFormat === 'image/png' ? 'is-active' : ''}`}
                  onClick={() => setCropFormat('image/png')}
                >
                  PNG
                </button>
              </div>

              <div className="control-label-row" style={{ marginTop: '0.5rem' }}>
                <span>Quality</span>
                <span className="control-value-badge">{cropQuality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={cropQuality}
                className="tool-slider"
                onChange={(e) => setCropQuality(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="results-panel">
            <div className="batch-action-bar">
              <div className="batch-summary">
                <span>Output: {previewDimensions.width} × {previewDimensions.height} px</span>
                <span>•</span>
                <span>{previewBlob ? formatBytes(previewBlob.size) : '...'}</span>
              </div>
              <div className="batch-buttons">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleDownloadCropped}
                  disabled={!previewBlob}
                >
                  Download Cropped
                </button>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                minHeight: '420px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                overflow: 'hidden',
              }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Cropped Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '480px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
