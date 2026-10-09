import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import JSZip from 'jszip'

// Configure worker path for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export interface ExtractedPage {
  pageNumber: number
  text: string
  lines: string[]
  width: number
  height: number
}

export interface ExtractedPdfDocument {
  numPages: number
  pages: ExtractedPage[]
  fullText: string
  title?: string
}

/**
 * Extract structured text and dimensions from a PDF arrayBuffer
 */
export async function extractPdfContent(data: ArrayBuffer): Promise<ExtractedPdfDocument> {
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const pages: ExtractedPage[] = []

  let fullText = ''

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    // Group text items by roughly identical Y-coordinates to reconstruct lines
    const lineMap = new Map<number, { x: number; text: string }[]>()

    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string') {
        const str = item.str
        if (!str.trim()) continue

        // item.transform has [scaleX, skewY, skewX, scaleY, transX, transY]
        const y = Math.round(item.transform[5] / 4) * 4 // snap slightly to group line
        const x = item.transform[4]

        if (!lineMap.has(y)) {
          lineMap.set(y, [])
        }
        lineMap.get(y)!.push({ x, text: str })
      }
    }

    // Sort lines from top (higher Y) to bottom (lower Y)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a)
    const lines: string[] = []

    for (const y of sortedY) {
      const itemsInLine = lineMap.get(y)!
      // Sort items from left to right
      itemsInLine.sort((a, b) => a.x - b.x)
      const lineStr = itemsInLine.map((it) => it.text).join(' ')
      if (lineStr.trim()) {
        lines.push(lineStr.trim())
      }
    }

    const pageText = lines.join('\n')
    fullText += (fullText ? '\n\n' : '') + `--- Page ${i} ---\n` + pageText

    pages.push({
      pageNumber: i,
      text: pageText,
      lines,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return {
    numPages,
    pages,
    fullText,
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate a standard Microsoft Word (.docx) file from extracted PDF pages
 */
export async function generateDocxFromPdf(pdfDoc: ExtractedPdfDocument, title: string = 'Document'): Promise<Blob> {
  const zip = new JSZip()

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  let documentParagraphs = ''

  // Document Title
  documentParagraphs += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:rPr>
          <w:b/>
          <w:sz w:val="48"/>
          <w:color w:val="107C41"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="48"/>
          <w:color w:val="107C41"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve">Converted from PDF — Privacy-First Client-Side Processing</w:t></w:r></w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
  `

  for (let i = 0; i < pdfDoc.pages.length; i++) {
    const page = pdfDoc.pages[i]

    // Page header
    documentParagraphs += `
      <w:p>
        <w:pPr>
          <w:rPr>
            <w:b/>
            <w:sz w:val="22"/>
            <w:color w:val="666666"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="22"/>
            <w:color w:val="666666"/>
          </w:rPr>
          <w:t xml:space="preserve">[Page ${page.pageNumber}]</w:t>
        </w:r>
      </w:p>
    `

    for (const line of page.lines) {
      documentParagraphs += `
        <w:p>
          <w:pPr>
            <w:spacing w:line="276" w:lineRule="auto" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:sz w:val="24"/>
            </w:rPr>
            <w:t xml:space="preserve">${escapeXml(line)}</w:t>
          </w:r>
        </w:p>
      `
    }

    // Page break between pages (except last)
    if (i < pdfDoc.pages.length - 1) {
      documentParagraphs += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${documentParagraphs}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`

  zip.file('[Content_Types].xml', contentTypes)
  zip.file('_rels/.rels', rels)
  zip.file('word/document.xml', documentXml)

  const buffer = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  return buffer
}

/**
 * Generate a standard Microsoft PowerPoint (.pptx) file from extracted PDF pages
 */
export async function generatePptxFromPdf(pdfDoc: ExtractedPdfDocument, title: string = 'Presentation'): Promise<Blob> {
  const zip = new JSZip()

  let overrideTypes = ''
  let sldIdLst = ''
  let presRels = ''

  for (let i = 1; i <= pdfDoc.pages.length; i++) {
    overrideTypes += `  <Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`
    sldIdLst += `    <p:sldId id="${255 + i}" r:id="rId${i}"/>\n`
    presRels += `  <Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>\n`
  }

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${overrideTypes}</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
${sldIdLst}  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${presRels}</Relationships>`

  zip.file('[Content_Types].xml', contentTypes)
  zip.file('_rels/.rels', rootRels)
  zip.file('ppt/presentation.xml', presentationXml)
  zip.file('ppt/_rels/presentation.xml.rels', presentationRels)

  // Generate each slide
  for (let i = 0; i < pdfDoc.pages.length; i++) {
    const pageIndex = i + 1
    const page = pdfDoc.pages[i]

    // Slide title and lines
    const slideTitle = `Page ${page.pageNumber}`
    const textLines = page.lines.slice(0, 16) // Max 16 lines for readability

    let paragraphsXml = ''
    for (const line of textLines) {
      paragraphsXml += `
          <a:p>
            <a:pPr marL="288000" indent="-288000">
              <a:buFont typeface="Arial"/>
              <a:buChar char="•"/>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1600">
                <a:solidFill><a:srgbClr val="333333"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(line)}</a:t>
            </a:r>
          </a:p>`
    }

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>

      <!-- Slide Title -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="title"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="838200" y="500000"/><a:ext cx="10515600" cy="900000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2800" b="1">
                <a:solidFill><a:srgbClr val="107C41"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(slideTitle)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Slide Content Text Box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="body" idx="1"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="838200" y="1600000"/><a:ext cx="10515600" cy="4800000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          ${paragraphsXml}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`

    zip.file(`ppt/slides/slide${pageIndex}.xml`, slideXml)
  }

  const buffer = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  return buffer
}

/**
 * Render a specific page of a PDF onto an HTML5 canvas
 */
export async function renderPdfPage(
  data: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise
}

/**
 * Generate a structured HTML document from extracted PDF pages
 */
export function generateHtmlFromPdf(pdfDoc: ExtractedPdfDocument, title: string = 'Document'): Blob {
  let bodyContent = `<h1>${escapeXml(title)}</h1>\n<p><em>Extracted from PDF via Privacy-First Client-Side Engine</em></p>\n<hr/>\n`

  for (const page of pdfDoc.pages) {
    bodyContent += `<section class="pdf-page" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px;">\n`
    bodyContent += `  <header style="font-size: 0.85rem; color: #777; margin-bottom: 1rem;">Page ${page.pageNumber}</header>\n`
    for (const line of page.lines) {
      bodyContent += `  <p style="margin: 0.5rem 0; line-height: 1.6;">${escapeXml(line)}</p>\n`
    }
    bodyContent += `</section>\n`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { color: #107C41; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`

  return new Blob([html], { type: 'text/html;charset=utf-8' })
}

/**
 * Generate clean Markdown from extracted PDF pages
 */
export function generateMarkdownFromPdf(pdfDoc: ExtractedPdfDocument, title: string = 'Document'): Blob {
  let md = `# ${title}\n\n> Extracted from PDF via Client-Side Engine\n\n`

  for (const page of pdfDoc.pages) {
    md += `## Page ${page.pageNumber}\n\n`
    for (const line of page.lines) {
      md += `${line}\n\n`
    }
    md += `---\n\n`
  }

  return new Blob([md], { type: 'text/markdown;charset=utf-8' })
}

/**
 * Render all pages of a PDF to image Blobs (PNG or JPEG)
 */
export async function renderPdfPagesToImages(
  data: ArrayBuffer,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 0.92,
  scale: number = 1.5,
  onProgress?: (current: number, total: number) => void
): Promise<{ pageNumber: number; blob: Blob }[]> {
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const results: { pageNumber: number; blob: Blob }[] = []

  const offscreenCanvas = document.createElement('canvas')
  const ctx = offscreenCanvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas 2D context')

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages)
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    offscreenCanvas.width = viewport.width
    offscreenCanvas.height = viewport.height

    // Clear background to white for JPEG
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, viewport.width, viewport.height)
    } else {
      ctx.clearRect(0, 0, viewport.width, viewport.height)
    }

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: offscreenCanvas,
    }).promise

    const blob = await new Promise<Blob | null>((res) => offscreenCanvas.toBlob(res, format, quality))
    if (blob) {
      results.push({ pageNumber: i, blob })
    }
  }

  return results
}
