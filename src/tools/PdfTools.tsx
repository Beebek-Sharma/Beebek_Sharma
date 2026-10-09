import { useState, useRef, useEffect } from 'react'
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'
import { downloadBlob, formatBytes } from './toolUtils'
import {
  extractPdfContent,
  generateDocxFromPdf,
  generatePptxFromPdf,
  generateHtmlFromPdf,
  generateMarkdownFromPdf,
  renderPdfPagesToImages,
  renderPdfPage,
} from './pdfConverterUtils'
import './PdfTools.css'

type PdfSubTool = 'convert-pdf' | 'edit-pdf' | 'images-to-pdf' | 'merge-pdf' | 'split-pdf'
type ConvertFormat = 'docx' | 'pptx' | 'txt' | 'html' | 'md' | 'png' | 'jpeg'

interface PageItem {
  originalIndex: number
  rotation: number
  isDeleted: boolean
  canvasRef?: HTMLCanvasElement | null
}

export function PdfTools() {
  const [subTool, setSubTool] = useState<PdfSubTool>('convert-pdf')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  // 1. PDF Converter State
  const [convertFile, setConvertFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<ConvertFormat>('docx')

  // 2. PDF Editor State
  const [editorFile, setEditorFile] = useState<File | null>(null)
  const [editorArrayBuffer, setEditorArrayBuffer] = useState<ArrayBuffer | null>(null)
  const [editorPages, setEditorPages] = useState<PageItem[]>([])
  const [activeEditorTab, setActiveEditorTab] = useState<'pages' | 'watermark' | 'numbering' | 'metadata'>('pages')

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL')
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3)
  const [watermarkSize, setWatermarkSize] = useState<number>(42)
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45)
  const [watermarkColor, setWatermarkColor] = useState<'emerald' | 'gray' | 'red' | 'blue'>('emerald')

  // Page Numbering Settings
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(false)
  const [numberPosition, setNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center')
  const [numberFormat, setNumberFormat] = useState<'page-x-of-y' | 'x-only'>('page-x-of-y')

  // Metadata Settings
  const [pdfMetaTitle, setPdfMetaTitle] = useState<string>('')
  const [pdfMetaAuthor, setPdfMetaAuthor] = useState<string>('')
  const [pdfMetaSubject, setPdfMetaSubject] = useState<string>('')

  // 3. Images to PDF State
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // 4. Merge PDF State
  const [pdfFiles, setPdfFiles] = useState<File[]>([])

  // 5. Split PDF State
  const [splitFile, setSplitFile] = useState<File | null>(null)
  const [pageRange, setPageRange] = useState<string>('1')
  const [totalPages, setTotalPages] = useState<number>(0)

  // Clear all states
  const handleClearAll = () => {
    setConvertFile(null)
    setEditorFile(null)
    setEditorArrayBuffer(null)
    setEditorPages([])
    setImageFiles([])
    setPdfFiles([])
    setSplitFile(null)
    setTotalPages(0)
    setStatusMessage('')
    setProgressPercent(0)
  }

  // --- 1. CONVERT PDF HANDLER ---
  const handleConvertPdf = async () => {
    if (!convertFile) return
    setIsProcessing(true)
    setProgressPercent(10)
    setStatusMessage('Reading PDF file...')

    try {
      const buffer = await convertFile.arrayBuffer()
      const baseName = convertFile.name.replace(/\.pdf$/i, '')

      if (targetFormat === 'png' || targetFormat === 'jpeg') {
        setStatusMessage('Rendering pages to images...')
        const mime = targetFormat === 'png' ? 'image/png' : 'image/jpeg'
        const ext = targetFormat === 'png' ? 'png' : 'jpg'

        const images = await renderPdfPagesToImages(buffer, mime, 0.92, 1.5, (cur, total) => {
          setProgressPercent(Math.round((cur / total) * 80) + 10)
          setStatusMessage(`Rendering page ${cur} of ${total}...`)
        })

        if (images.length === 1) {
          downloadBlob(images[0].blob, `${baseName}_page_1.${ext}`)
        } else {
          setStatusMessage('Packaging images into ZIP archive...')
          const zip = new JSZip()
          images.forEach((img) => {
            zip.file(`${baseName}_page_${img.pageNumber}.${ext}`, img.blob)
          })
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          downloadBlob(zipBlob, `${baseName}_images.zip`)
        }
        setStatusMessage(`Successfully converted ${images.length} pages to ${targetFormat.toUpperCase()}!`)
      } else {
        setStatusMessage('Extracting text and structure from PDF...')
        const pdfContent = await extractPdfContent(buffer)
        setProgressPercent(60)

        if (targetFormat === 'docx') {
          setStatusMessage('Generating Microsoft Word (.docx) document...')
          const docxBlob = await generateDocxFromPdf(pdfContent, baseName)
          downloadBlob(docxBlob, `${baseName}.docx`)
          setStatusMessage('Downloaded Word (.docx) document!')
        } else if (targetFormat === 'pptx') {
          setStatusMessage('Generating PowerPoint (.pptx) presentation...')
          const pptxBlob = await generatePptxFromPdf(pdfContent, baseName)
          downloadBlob(pptxBlob, `${baseName}.pptx`)
          setStatusMessage('Downloaded PowerPoint (.pptx) presentation!')
        } else if (targetFormat === 'html') {
          const htmlBlob = generateHtmlFromPdf(pdfContent, baseName)
          downloadBlob(htmlBlob, `${baseName}.html`)
          setStatusMessage('Downloaded HTML document!')
        } else if (targetFormat === 'md') {
          const mdBlob = generateMarkdownFromPdf(pdfContent, baseName)
          downloadBlob(mdBlob, `${baseName}.md`)
          setStatusMessage('Downloaded Markdown (.md) document!')
        } else {
          // txt
          const txtBlob = new Blob([pdfContent.fullText], { type: 'text/plain;charset=utf-8' })
          downloadBlob(txtBlob, `${baseName}.txt`)
          setStatusMessage('Downloaded plain text (.txt)!')
        }
      }
      setProgressPercent(100)
    } catch (err) {
      console.error(err)
      setStatusMessage(`Conversion error: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 2. PDF EDITOR LOAD HANDLER ---
  const handleEditorFileUpload = async (file: File) => {
    setEditorFile(file)
    setIsProcessing(true)
    setStatusMessage('Loading PDF for editing...')
    try {
      const buffer = await file.arrayBuffer()
      setEditorArrayBuffer(buffer)

      const doc = await PDFDocument.load(buffer)
      const count = doc.getPageCount()

      // Metadata
      setPdfMetaTitle(doc.getTitle() || file.name.replace(/\.pdf$/i, ''))
      setPdfMetaAuthor(doc.getAuthor() || '')
      setPdfMetaSubject(doc.getSubject() || '')

      const initialPages: PageItem[] = []
      for (let i = 0; i < count; i++) {
        initialPages.push({
          originalIndex: i,
          rotation: 0,
          isDeleted: false,
        })
      }
      setEditorPages(initialPages)
      setStatusMessage(`Loaded ${count} pages. Ready to edit.`)
    } catch (err) {
      setStatusMessage(`Error loading PDF: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Effect to render thumbnails when editorPages or editorArrayBuffer changes
  useEffect(() => {
    if (!editorArrayBuffer || editorPages.length === 0) return

    editorPages.forEach((page) => {
      if (page.isDeleted) return
      const canvas = document.getElementById(`thumb-canvas-${page.originalIndex}`) as HTMLCanvasElement | null
      if (canvas) {
        renderPdfPage(editorArrayBuffer, page.originalIndex + 1, canvas, 0.35).catch(() => {})
      }
    })
  }, [editorArrayBuffer, editorPages])

  // Move page up
  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= editorPages.length) return

    const newPages = [...editorPages]
    const temp = newPages[index]
    newPages[index] = newPages[targetIndex]
    newPages[targetIndex] = temp
    setEditorPages(newPages)
  }

  // Rotate page
  const handleRotatePage = (index: number) => {
    const newPages = [...editorPages]
    newPages[index] = {
      ...newPages[index],
      rotation: (newPages[index].rotation + 90) % 360,
    }
    setEditorPages(newPages)
  }

  // Delete/Restore page
  const handleToggleDeletePage = (index: number) => {
    const newPages = [...editorPages]
    newPages[index] = {
      ...newPages[index],
      isDeleted: !newPages[index].isDeleted,
    }
    setEditorPages(newPages)
  }

  // Save and export edited PDF
  const handleSaveEditedPdf = async () => {
    if (!editorArrayBuffer || !editorFile) return
    setIsProcessing(true)
    setStatusMessage('Compiling edited PDF...')

    try {
      const srcDoc = await PDFDocument.load(editorArrayBuffer)
      const newDoc = await PDFDocument.create()

      const activePages = editorPages.filter((p) => !p.isDeleted)
      if (activePages.length === 0) {
        setStatusMessage('Cannot export an empty PDF document.')
        setIsProcessing(false)
        return
      }

      // Copy pages in rearranged order
      const indicesToCopy = activePages.map((p) => p.originalIndex)
      const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy)

      // Color selection for watermark
      let wmColor = rgb(0.1, 0.6, 0.4) // emerald
      if (watermarkColor === 'red') wmColor = rgb(0.85, 0.15, 0.15)
      if (watermarkColor === 'gray') wmColor = rgb(0.5, 0.5, 0.5)
      if (watermarkColor === 'blue') wmColor = rgb(0.1, 0.35, 0.8)

      const fontBold = await newDoc.embedFont(StandardFonts.HelveticaBold)
      const fontRegular = await newDoc.embedFont(StandardFonts.Helvetica)

      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i]
        const pageItem = activePages[i]

        // Apply rotation
        if (pageItem.rotation !== 0) {
          const currentRot = page.getRotation().angle
          page.setRotation(degrees(currentRot + pageItem.rotation))
        }

        newDoc.addPage(page)

        const width = page.getWidth()
        const height = page.getHeight()

        // 1. Apply watermark if specified
        if (watermarkText.trim()) {
          const textW = fontBold.widthOfTextAtSize(watermarkText, watermarkSize)

          let x = (width - textW) / 2
          let y = height / 2

          if (watermarkAngle === 0) {
            y = height / 2
          } else {
            // Diagonal adjustment
            x = width * 0.25
            y = height * 0.35
          }

          page.drawText(watermarkText, {
            x,
            y,
            size: watermarkSize,
            font: fontBold,
            color: wmColor,
            opacity: watermarkOpacity,
            rotate: degrees(watermarkAngle),
          })
        }

        // 2. Apply Page Numbers if enabled
        if (addPageNumbers) {
          const numString =
            numberFormat === 'page-x-of-y' ? `Page ${i + 1} of ${copiedPages.length}` : `${i + 1}`
          const fontSize = 10
          const numW = fontRegular.widthOfTextAtSize(numString, fontSize)

          let nx = (width - numW) / 2
          let ny = 24

          if (numberPosition === 'bottom-right') {
            nx = width - numW - 36
            ny = 24
          } else if (numberPosition === 'top-right') {
            nx = width - numW - 36
            ny = height - 32
          }

          page.drawText(numString, {
            x: nx,
            y: ny,
            size: fontSize,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
          })
        }
      }

      // Metadata
      if (pdfMetaTitle) newDoc.setTitle(pdfMetaTitle)
      if (pdfMetaAuthor) newDoc.setAuthor(pdfMetaAuthor)
      if (pdfMetaSubject) newDoc.setSubject(pdfMetaSubject)
      newDoc.setProducer('Beebek Sharma Browser PDF Engine')

      const pdfBytes = await newDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      downloadBlob(blob, `edited_${editorFile.name}`)
      setStatusMessage('Edited PDF saved and downloaded successfully!')
    } catch (err) {
      console.error(err)
      setStatusMessage(`Error saving edited PDF: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 3. IMAGES TO PDF HANDLER ---
  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) return
    setIsProcessing(true)
    setStatusMessage('Compiling PDF...')

    try {
      const pdfDoc = await PDFDocument.create()

      for (const file of imageFiles) {
        const imageBytes = await file.arrayBuffer()
        let embeddedImage

        if (file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
          embeddedImage = await pdfDoc.embedJpg(imageBytes)
        } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes)
        } else {
          // Convert other formats via canvas to PNG first
          const canvas = document.createElement('canvas')
          const img = new Image()
          const dataUrl = URL.createObjectURL(file)
          await new Promise<void>((resolve) => {
            img.onload = () => {
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0)
              resolve()
            }
            img.src = dataUrl
          })
          URL.revokeObjectURL(dataUrl)
          const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
          if (pngBlob) {
            const pngBytes = await pngBlob.arrayBuffer()
            embeddedImage = await pdfDoc.embedPng(pngBytes)
          }
        }

        if (embeddedImage) {
          const dims = embeddedImage.scale(1)
          const isLandscape = pageOrientation === 'landscape' || dims.width > dims.height
          const page = pdfDoc.addPage([isLandscape ? 842 : 595, isLandscape ? 595 : 842])

          const pageWidth = page.getWidth()
          const pageHeight = page.getHeight()
          const margin = 36

          const maxW = pageWidth - margin * 2
          const maxH = pageHeight - margin * 2
          const scale = Math.min(maxW / dims.width, maxH / dims.height, 1)

          const drawW = dims.width * scale
          const drawH = dims.height * scale
          const x = (pageWidth - drawW) / 2
          const y = (pageHeight - drawH) / 2

          page.drawImage(embeddedImage, {
            x,
            y,
            width: drawW,
            height: drawH,
          })
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      downloadBlob(blob, 'compiled_document.pdf')
      setStatusMessage('PDF generated successfully!')
    } catch (err) {
      setStatusMessage(`Error: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 4. MERGE PDFS HANDLER ---
  const handleMergePdfs = async () => {
    if (pdfFiles.length < 2) return
    setIsProcessing(true)
    setStatusMessage('Merging PDF documents...')

    try {
      const mergedPdf = await PDFDocument.create()

      for (const file of pdfFiles) {
        const fileBytes = await file.arrayBuffer()
        const donorPdf = await PDFDocument.load(fileBytes)
        const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      downloadBlob(blob, 'merged_document.pdf')
      setStatusMessage('Merged successfully!')
    } catch (err) {
      setStatusMessage(`Error merging: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- 5. SPLIT PDF HANDLER ---
  const handleSplitPdf = async () => {
    if (!splitFile) return
    setIsProcessing(true)
    setStatusMessage('Extracting pages...')

    try {
      const fileBytes = await splitFile.arrayBuffer()
      const srcPdf = await PDFDocument.load(fileBytes)
      const newPdf = await PDFDocument.create()

      const pageIndicesToCopy: number[] = []
      const parts = pageRange.split(',')

      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-')
          const start = parseInt(startStr, 10)
          const end = parseInt(endStr, 10)
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= srcPdf.getPageCount()) {
                pageIndicesToCopy.push(i - 1)
              }
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10)
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= srcPdf.getPageCount()) {
            pageIndicesToCopy.push(pageNum - 1)
          }
        }
      }

      if (pageIndicesToCopy.length === 0) {
        setStatusMessage('No valid page numbers found in range.')
        setIsProcessing(false)
        return
      }

      const copiedPages = await newPdf.copyPages(srcPdf, pageIndicesToCopy)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      downloadBlob(blob, `extracted_pages_${splitFile.name}`)
      setStatusMessage(`Extracted ${copiedPages.length} pages successfully!`)
    } catch (err) {
      setStatusMessage(`Error extracting pages: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="tool-view">
      <div className="tool-header-row">
        <div className="tool-header-title">
          <h2>Client-Side PDF Suite & Editor</h2>
          <p>
            Convert PDF to DOCX, PPTX, HTML, Markdown, and Images, or edit pages, add watermarks, and reorder without
            uploading. 100% browser-based.
          </p>
        </div>
        <button className="clear-all-btn" onClick={handleClearAll}>
          Clear All
        </button>
      </div>

      {/* Subtool Navigation */}
      <div className="pdf-nav">
        <button
          className={`pdf-nav-btn ${subTool === 'convert-pdf' ? 'active' : ''}`}
          onClick={() => setSubTool('convert-pdf')}
        >
          🔄 PDF Converter (to Word/PPTX)
        </button>
        <button
          className={`pdf-nav-btn ${subTool === 'edit-pdf' ? 'active' : ''}`}
          onClick={() => setSubTool('edit-pdf')}
        >
          ✏️ PDF Editor & Watermark
        </button>
        <button
          className={`pdf-nav-btn ${subTool === 'images-to-pdf' ? 'active' : ''}`}
          onClick={() => setSubTool('images-to-pdf')}
        >
          🖼 Images → PDF
        </button>
        <button
          className={`pdf-nav-btn ${subTool === 'merge-pdf' ? 'active' : ''}`}
          onClick={() => setSubTool('merge-pdf')}
        >
          📑 Merge PDFs
        </button>
        <button
          className={`pdf-nav-btn ${subTool === 'split-pdf' ? 'active' : ''}`}
          onClick={() => setSubTool('split-pdf')}
        >
          ✂️ Split & Extract Pages
        </button>
      </div>

      {statusMessage && (
        <div className="action-status-banner">
          <span>{statusMessage}</span>
          {progressPercent > 0 && progressPercent < 100 && (
            <div
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                marginTop: '6px',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'var(--accent-bright)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 1: CONVERT PDF --- */}
      {subTool === 'convert-pdf' && (
        <div className="tool-panel-box">
          <h3>Convert PDF to Documents, Slides & Formats</h3>
          <p className="tool-panel-desc">
            Extract text, paragraphs, and structure from your PDF and convert it to Microsoft Word (.docx), PowerPoint
            (.pptx), Markdown, HTML, or high-res images directly on your machine.
          </p>

          <div className="upload-dropzone" onClick={() => document.getElementById('convert-pdf-input')?.click()}>
            <input
              id="convert-pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setConvertFile(e.target.files[0])
                }
              }}
            />
            <div className="dropzone-icon">📄</div>
            <div className="dropzone-text">
              {convertFile ? <strong>{convertFile.name}</strong> : 'Drop your PDF here, or click to browse'}
            </div>
            <div className="dropzone-sub">
              {convertFile ? `${formatBytes(convertFile.size)} • Ready to convert` : 'All conversions happen in your browser'}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Choose Target Output Format:</label>
            <div className="convert-target-grid">
              <div
                className={`convert-target-card ${targetFormat === 'docx' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('docx')}
              >
                <div className="convert-target-badge">WORD</div>
                <div className="convert-target-name">Microsoft Word (.docx)</div>
                <div className="convert-target-desc">Preserves paragraphs, headings &amp; page breaks in valid OpenXML.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'pptx' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('pptx')}
              >
                <div className="convert-target-badge">POWERPOINT</div>
                <div className="convert-target-name">PowerPoint (.pptx)</div>
                <div className="convert-target-desc">Converts PDF pages into presentation slides with bullet points.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'png' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('png')}
              >
                <div className="convert-target-badge">IMAGES</div>
                <div className="convert-target-name">PNG Images (.png)</div>
                <div className="convert-target-desc">High-resolution canvas renders. Downloads as ZIP if multi-page.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'jpeg' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('jpeg')}
              >
                <div className="convert-target-badge">IMAGES</div>
                <div className="convert-target-name">JPEG Images (.jpg)</div>
                <div className="convert-target-desc">Smaller file size image renders with white background.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'md' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('md')}
              >
                <div className="convert-target-badge">MARKDOWN</div>
                <div className="convert-target-name">Markdown (.md)</div>
                <div className="convert-target-desc">Formatted markdown with page separators for notes and docs.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'html' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('html')}
              >
                <div className="convert-target-badge">HTML</div>
                <div className="convert-target-name">HTML Web Page (.html)</div>
                <div className="convert-target-desc">Clean semantic web document viewable in any web browser.</div>
              </div>

              <div
                className={`convert-target-card ${targetFormat === 'txt' ? 'selected' : ''}`}
                onClick={() => setTargetFormat('txt')}
              >
                <div className="convert-target-badge">TEXT</div>
                <div className="convert-target-name">Plain Text (.txt)</div>
                <div className="convert-target-desc">Pure extracted text with UTF-8 character encoding.</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="primary-btn"
              disabled={!convertFile || isProcessing}
              onClick={handleConvertPdf}
            >
              {isProcessing ? 'Converting Locally...' : `Convert & Download ${targetFormat.toUpperCase()}`}
            </button>
            {convertFile && (
              <button
                className="secondary-btn"
                onClick={() => {
                  setConvertFile(null)
                  setStatusMessage('')
                }}
              >
                Remove File
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTOOL 2: PDF EDITOR --- */}
      {subTool === 'edit-pdf' && (
        <div className="tool-panel-box">
          <h3>Visual PDF Editor, Watermark &amp; Page Manager</h3>
          <p className="tool-panel-desc">
            Reorder pages, rotate orientations, remove pages, apply custom watermarks or page numbers, and edit document
            metadata.
          </p>

          {!editorFile ? (
            <div className="upload-dropzone" onClick={() => document.getElementById('editor-pdf-input')?.click()}>
              <input
                id="editor-pdf-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleEditorFileUpload(e.target.files[0])
                  }
                }}
              />
              <div className="dropzone-icon">✏️</div>
              <div className="dropzone-text">Drop a PDF to open the Editor</div>
              <div className="dropzone-sub">Preview pages, add stamps &amp; adjust layout</div>
            </div>
          ) : (
            <div className="pdf-editor-layout">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <strong>{editorFile.name}</strong>
                  <span className="file-badge">{formatBytes(editorFile.size)}</span>
                  <span className="file-badge">
                    {editorPages.filter((p) => !p.isDeleted).length} / {editorPages.length} Pages Active
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setEditorFile(null)
                      setEditorArrayBuffer(null)
                      setEditorPages([])
                    }}
                  >
                    Change File
                  </button>
                  <button className="primary-btn" disabled={isProcessing} onClick={handleSaveEditedPdf}>
                    {isProcessing ? 'Saving...' : 'Save & Download PDF'}
                  </button>
                </div>
              </div>

              <div className="pdf-editor-panel">
                {/* Left Column: Visual Page Grid */}
                <div className="pdf-page-manager">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pages Arrangement &amp; Orientation</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Click 🔄 to rotate • ❌ to delete • ◀ ▶ to reorder
                    </span>
                  </div>

                  <div className="pdf-page-grid">
                    {editorPages.map((page, idx) => (
                      <div
                        key={page.originalIndex}
                        className={`pdf-page-card ${page.isDeleted ? 'deleted' : ''}`}
                      >
                        <div className="pdf-page-meta">
                          <span>Page {idx + 1}</span>
                          {page.rotation > 0 && <span>{page.rotation}°</span>}
                        </div>

                        <div
                          className="pdf-page-thumbnail"
                          style={{
                            transform: `rotate(${page.rotation}deg)`,
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <canvas id={`thumb-canvas-${page.originalIndex}`} />
                        </div>

                        <div className="pdf-page-actions">
                          <button
                            className="page-btn-icon"
                            title="Move Left / Earlier"
                            disabled={idx === 0}
                            onClick={() => handleMovePage(idx, 'up')}
                          >
                            ◀
                          </button>
                          <button
                            className="page-btn-icon"
                            title="Rotate 90° Clockwise"
                            onClick={() => handleRotatePage(idx)}
                          >
                            🔄
                          </button>
                          <button
                            className="page-btn-icon delete-btn"
                            title={page.isDeleted ? 'Restore Page' : 'Delete Page'}
                            onClick={() => handleToggleDeletePage(idx)}
                          >
                            {page.isDeleted ? '↩' : '✕'}
                          </button>
                          <button
                            className="page-btn-icon"
                            title="Move Right / Later"
                            disabled={idx === editorPages.length - 1}
                            onClick={() => handleMovePage(idx, 'down')}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Watermark, Numbering & Metadata Tabs */}
                <div className="editor-controls-card">
                  <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <button
                      className={`pdf-nav-btn ${activeEditorTab === 'pages' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveEditorTab('pages')}
                    >
                      Watermark
                    </button>
                    <button
                      className={`pdf-nav-btn ${activeEditorTab === 'numbering' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveEditorTab('numbering')}
                    >
                      Numbers
                    </button>
                    <button
                      className={`pdf-nav-btn ${activeEditorTab === 'metadata' ? 'active' : ''}`}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => setActiveEditorTab('metadata')}
                    >
                      Metadata
                    </button>
                  </div>

                  {activeEditorTab === 'pages' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="editor-section-title">Watermark &amp; Stamp</div>
                      <div className="form-group">
                        <label>Watermark Text</label>
                        <input
                          type="text"
                          className="form-control-input"
                          placeholder="e.g. CONFIDENTIAL, DRAFT"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Angle &amp; Style</label>
                        <select
                          className="form-control-select"
                          value={watermarkAngle}
                          onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                        >
                          <option value={45}>45° Diagonal</option>
                          <option value={0}>0° Horizontal</option>
                          <option value={-45}>-45° Diagonal</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Color</label>
                        <select
                          className="form-control-select"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value as any)}
                        >
                          <option value="emerald">Emerald Green</option>
                          <option value="gray">Subtle Gray</option>
                          <option value="red">Warning Red</option>
                          <option value="blue">Corporate Blue</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Font Size ({watermarkSize}pt)</label>
                        <input
                          type="range"
                          min="16"
                          max="72"
                          value={watermarkSize}
                          onChange={(e) => setWatermarkSize(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {activeEditorTab === 'numbering' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="editor-section-title">Header / Footer Page Numbers</div>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={addPageNumbers}
                          onChange={(e) => setAddPageNumbers(e.target.checked)}
                        />
                        <span>Enable Page Numbers</span>
                      </label>

                      {addPageNumbers && (
                        <>
                          <div className="form-group">
                            <label>Format</label>
                            <select
                              className="form-control-select"
                              value={numberFormat}
                              onChange={(e) => setNumberFormat(e.target.value as any)}
                            >
                              <option value="page-x-of-y">Page X of Y (e.g. Page 1 of 5)</option>
                              <option value="x-only">Number Only (e.g. 1)</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Position</label>
                            <select
                              className="form-control-select"
                              value={numberPosition}
                              onChange={(e) => setNumberPosition(e.target.value as any)}
                            >
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                              <option value="top-right">Top Right</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeEditorTab === 'metadata' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="editor-section-title">PDF Metadata Info</div>
                      <div className="form-group">
                        <label>Document Title</label>
                        <input
                          type="text"
                          className="form-control-input"
                          value={pdfMetaTitle}
                          onChange={(e) => setPdfMetaTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Author</label>
                        <input
                          type="text"
                          className="form-control-input"
                          value={pdfMetaAuthor}
                          onChange={(e) => setPdfMetaAuthor(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Subject</label>
                        <input
                          type="text"
                          className="form-control-input"
                          value={pdfMetaSubject}
                          onChange={(e) => setPdfMetaSubject(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 3: IMAGES TO PDF --- */}
      {subTool === 'images-to-pdf' && (
        <div className="tool-panel-box">
          <h3>Images to PDF Generator</h3>
          <p className="tool-panel-desc">
            Combine multiple JPG, PNG, and WebP images into a single clean PDF document.
          </p>

          <div className="upload-dropzone" onClick={() => document.getElementById('img-pdf-input')?.click()}>
            <input
              id="img-pdf-input"
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  setImageFiles(Array.from(e.target.files))
                }
              }}
            />
            <div className="dropzone-icon">🖼</div>
            <div className="dropzone-text">
              {imageFiles.length > 0 ? `${imageFiles.length} images selected` : 'Drop images here, or click to browse'}
            </div>
            <div className="dropzone-sub">Supports JPEG, PNG, WebP, BMP</div>
          </div>

          {imageFiles.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Selected Images: {imageFiles.length}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem' }}>Page Orientation:</label>
                  <select
                    value={pageOrientation}
                    onChange={(e) => setPageOrientation(e.target.value as any)}
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                    }}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '180px', overflowY: 'auto' }}>
                {imageFiles.map((file, i) => (
                  <span key={i} className="file-badge">
                    {file.name} ({formatBytes(file.size)})
                  </span>
                ))}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <button
                  className="primary-btn"
                  disabled={isProcessing}
                  onClick={handleConvertImagesToPdf}
                >
                  {isProcessing ? 'Generating PDF...' : 'Compile Images to PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 4: MERGE PDFS --- */}
      {subTool === 'merge-pdf' && (
        <div className="tool-panel-box">
          <h3>Merge PDF Documents</h3>
          <p className="tool-panel-desc">Combine two or more PDF files into a single merged document in order.</p>

          <div className="upload-dropzone" onClick={() => document.getElementById('merge-pdf-input')?.click()}>
            <input
              id="merge-pdf-input"
              type="file"
              multiple
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  setPdfFiles(Array.from(e.target.files))
                }
              }}
            />
            <div className="dropzone-icon">📑</div>
            <div className="dropzone-text">
              {pdfFiles.length > 0 ? `${pdfFiles.length} PDF files selected` : 'Drop multiple PDF files here'}
            </div>
            <div className="dropzone-sub">Select 2 or more files to concatenate</div>
          </div>

          {pdfFiles.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {pdfFiles.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--surface-2)',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>
                      {idx + 1}. {f.name}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>

              <button
                className="primary-btn"
                disabled={pdfFiles.length < 2 || isProcessing}
                onClick={handleMergePdfs}
              >
                {isProcessing ? 'Merging...' : `Merge ${pdfFiles.length} PDFs`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTOOL 5: SPLIT PDF --- */}
      {subTool === 'split-pdf' && (
        <div className="tool-panel-box">
          <h3>Split PDF &amp; Extract Pages</h3>
          <p className="tool-panel-desc">Extract specific pages or page ranges from a PDF document.</p>

          <div className="upload-dropzone" onClick={() => document.getElementById('split-pdf-input')?.click()}>
            <input
              id="split-pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0]
                  setSplitFile(file)
                  const buf = await file.arrayBuffer()
                  const doc = await PDFDocument.load(buf)
                  setTotalPages(doc.getPageCount())
                }
              }}
            />
            <div className="dropzone-icon">✂️</div>
            <div className="dropzone-text">
              {splitFile ? <strong>{splitFile.name}</strong> : 'Drop a PDF file to split'}
            </div>
            <div className="dropzone-sub">{totalPages > 0 ? `Total Pages: ${totalPages}` : 'Select a PDF document'}</div>
          </div>

          {splitFile && totalPages > 0 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem' }}>
                Page Range to Extract (Total Pages: {totalPages}):
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1, 3-5, 8"
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  maxWidth: '300px',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Examples: "1" (first page), "1-3" (pages 1 to 3), "1, 4-6" (combination)
              </span>

              <div style={{ marginTop: '0.5rem' }}>
                <button
                  className="primary-btn"
                  disabled={isProcessing}
                  onClick={handleSplitPdf}
                >
                  {isProcessing ? 'Extracting...' : 'Extract & Download'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
