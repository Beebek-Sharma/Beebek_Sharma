import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface EpubMetadata {
  title: string
  creator: string
  publisher?: string
  language?: string
  description?: string
  date?: string
}

export interface EpubChapter {
  id: string
  title: string
  href: string
  htmlContent: string
  textContent: string
}

export interface ParsedEpub {
  metadata: EpubMetadata
  chapters: EpubChapter[]
  coverUrl?: string
  totalCharacters: number
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Parse an EPUB archive completely in the browser via JSZip and DOMParser
 */
export async function parseEpub(data: ArrayBuffer): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(data)

  // 1. Read META-INF/container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('text')
  if (!containerXml) {
    throw new Error('Invalid EPUB file: META-INF/container.xml not found.')
  }

  const parser = new DOMParser()
  const containerDoc = parser.parseFromString(containerXml, 'application/xml')
  const rootfile = containerDoc.querySelector('rootfile')
  const opfPath = rootfile?.getAttribute('full-path') || 'OEBPS/content.opf'

  // Determine base folder of OPF
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : ''

  // 2. Read OPF file
  const opfXml = await zip.file(opfPath)?.async('text')
  if (!opfXml) {
    throw new Error(`OPF package file not found at ${opfPath}`)
  }

  const opfDoc = parser.parseFromString(opfXml, 'application/xml')

  // Parse Metadata
  const title = opfDoc.querySelector('dc\\:title, title')?.textContent?.trim() || 'Untitled Book'
  const creator = opfDoc.querySelector('dc\\:creator, creator')?.textContent?.trim() || 'Unknown Author'
  const publisher = opfDoc.querySelector('dc\\:publisher, publisher')?.textContent?.trim() || undefined
  const language = opfDoc.querySelector('dc\\:language, language')?.textContent?.trim() || 'en'
  const description = opfDoc.querySelector('dc\\:description, description')?.textContent?.trim() || undefined
  const date = opfDoc.querySelector('dc\\:date, date')?.textContent?.trim() || undefined

  // Parse Manifest
  const manifestItems = new Map<string, { href: string; mediaType: string; properties?: string }>()
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    const mediaType = item.getAttribute('media-type') || ''
    const properties = item.getAttribute('properties') || ''
    if (id && href) {
      manifestItems.set(id, { href, mediaType, properties })
    }
  })

  // Look for cover image
  let coverUrl: string | undefined = undefined
  for (const [, item] of manifestItems.entries()) {
    if (
      item.properties?.includes('cover-image') ||
      item.href.toLowerCase().includes('cover') && (item.mediaType.startsWith('image/'))
    ) {
      const coverPath = opfDir + item.href
      const coverFile = zip.file(coverPath) || zip.file(item.href)
      if (coverFile) {
        const coverBlob = await coverFile.async('blob')
        coverUrl = URL.createObjectURL(coverBlob)
        break
      }
    }
  }

  // Parse Spine
  const spineItemRefs: string[] = []
  opfDoc.querySelectorAll('spine > itemref').forEach((itemref) => {
    const idref = itemref.getAttribute('idref')
    if (idref) {
      spineItemRefs.push(idref)
    }
  })

  // 3. Read Chapters in spine order
  const chapters: EpubChapter[] = []
  let totalCharacters = 0

  for (let i = 0; i < spineItemRefs.length; i++) {
    const id = spineItemRefs[i]
    const item = manifestItems.get(id)
    if (!item) continue

    const filePath = opfDir ? opfDir + item.href : item.href
    // Try exact path or decoded path
    let chapterFile = zip.file(filePath)
    if (!chapterFile) {
      chapterFile = zip.file(decodeURIComponent(filePath))
    }
    if (!chapterFile) {
      // Fallback: search zip entries ending with href basename
      const hrefBasename = item.href.split('/').pop() || ''
      const matched = Object.keys(zip.files).find((k) => k.endsWith(hrefBasename))
      if (matched) chapterFile = zip.file(matched)
    }

    if (!chapterFile) continue

    const rawHtml = await chapterFile.async('text')
    const chapterDoc = parser.parseFromString(rawHtml, 'text/html')

    // Clean scripts or dangerous tags
    chapterDoc.querySelectorAll('script, style, link, meta').forEach((el) => el.remove())

    // Determine Chapter Title
    let chapterTitle =
      chapterDoc.querySelector('h1, h2, h3, title')?.textContent?.trim() || `Chapter ${chapters.length + 1}`
    if (chapterTitle.length > 80) {
      chapterTitle = chapterTitle.substring(0, 77) + '...'
    }

    const bodyHtml = chapterDoc.body ? chapterDoc.body.innerHTML : rawHtml
    const textContent = (chapterDoc.body?.textContent || '').replace(/\s+/g, ' ').trim()

    if (textContent.length > 0) {
      totalCharacters += textContent.length
      chapters.push({
        id,
        title: chapterTitle,
        href: item.href,
        htmlContent: bodyHtml,
        textContent,
      })
    }
  }

  return {
    metadata: {
      title,
      creator,
      publisher,
      language,
      description,
      date,
    },
    chapters,
    coverUrl,
    totalCharacters,
  }
}

/**
 * Generate a standard .epub file from chapters and metadata
 */
export async function createEpub({
  title,
  author,
  language = 'en',
  chapters,
}: {
  title: string
  author: string
  language?: string
  chapters: { title: string; content: string }[]
}): Promise<Blob> {
  const zip = new JSZip()
  const bookId = 'urn:uuid:' + Math.random().toString(36).substring(2, 15)

  // 1. mimetype (uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  )

  // 3. OEBPS/stylesheet.css
  const stylesheet = `
body {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.6;
  margin: 5%;
  color: #222222;
}
h1, h2, h3 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111111;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
p {
  margin-bottom: 1em;
  text-indent: 1.2em;
}
`
  zip.file('OEBPS/stylesheet.css', stylesheet)

  // 4. Manifest and Spine XML
  let manifestItemsXml = `    <item id="css" href="stylesheet.css" media-type="text/css"/>\n    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`
  let spineItemRefsXml = ''
  let navPointsXml = ''

  for (let i = 0; i < chapters.length; i++) {
    const chNum = i + 1
    const chId = `chapter_${chNum}`
    const chFile = `chapter_${chNum}.xhtml`
    const ch = chapters[i]

    manifestItemsXml += `    <item id="${chId}" href="${chFile}" media-type="application/xhtml+xml"/>\n`
    spineItemRefsXml += `    <itemref idref="${chId}"/>\n`
    navPointsXml += `    <navPoint id="navPoint-${chNum}" playOrder="${chNum}">
      <navLabel><text>${escapeXml(ch.title || `Chapter ${chNum}`)}</text></navLabel>
      <content src="${chFile}"/>
    </navPoint>\n`

    // Convert raw content text paragraphs into <p> tags if not already html
    let formattedBody = ''
    if (ch.content.includes('<p>') || ch.content.includes('<div>')) {
      formattedBody = ch.content
    } else {
      const paragraphs = ch.content.split(/\n\s*\n/)
      formattedBody = paragraphs
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('\n')
    }

    const chapterXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(ch.title || `Chapter ${chNum}`)}</title>
  <link rel="stylesheet" href="stylesheet.css" type="text/css"/>
</head>
<body>
  <h1>${escapeXml(ch.title || `Chapter ${chNum}`)}</h1>
  ${formattedBody}
</body>
</html>`

    zip.file(`OEBPS/${chFile}`, chapterXhtml)
  }

  // 5. OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${escapeXml(language)}</dc:language>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
  </metadata>
  <manifest>
${manifestItemsXml}  </manifest>
  <spine toc="ncx">
${spineItemRefsXml}  </spine>
</package>`
  zip.file('OEBPS/content.opf', contentOpf)

  // 6. OEBPS/toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <docAuthor><text>${escapeXml(author)}</text></docAuthor>
  <navMap>
${navPointsXml}  </navMap>
</ncx>`
  zip.file('OEBPS/toc.ncx', tocNcx)

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
  })
}

/**
 * Convert an EPUB into a paginated PDF via pdf-lib
 */
export async function convertEpubToPdf(epub: ParsedEpub): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Page dimensions (A4)
  const pageWidth = 595
  const pageHeight = 842
  const margin = 50
  const usableWidth = pageWidth - margin * 2
  const lineHeight = 16
  const fontSize = 11

  // Cover / Title Page
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight])
  titlePage.drawText(epub.metadata.title, {
    x: margin,
    y: pageHeight - 200,
    size: 26,
    font: fontBold,
    color: rgb(0.1, 0.5, 0.35),
    maxWidth: usableWidth,
  })

  titlePage.drawText(`By ${epub.metadata.creator}`, {
    x: margin,
    y: pageHeight - 240,
    size: 15,
    font,
    color: rgb(0.3, 0.3, 0.3),
  })

  if (epub.metadata.description) {
    const descText = epub.metadata.description.substring(0, 300)
    titlePage.drawText(descText, {
      x: margin,
      y: pageHeight - 300,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: usableWidth,
    })
  }

  // Draw Chapters
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let currentY = pageHeight - margin

  function ensureSpace(needed: number) {
    if (currentY - needed < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      currentY = pageHeight - margin
    }
  }

  for (const chapter of epub.chapters) {
    ensureSpace(60)

    // Chapter Title
    currentPage.drawText(chapter.title, {
      x: margin,
      y: currentY - 24,
      size: 16,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.08),
      maxWidth: usableWidth,
    })
    currentY -= 40

    // Wrap plain text into words
    const words = chapter.textContent.split(/\s+/)
    let line = ''

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const textWidth = font.widthOfTextAtSize(testLine, fontSize)

      if (textWidth > usableWidth) {
        ensureSpace(lineHeight)
        currentPage.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        })
        currentY -= lineHeight
        line = word
      } else {
        line = testLine
      }
    }

    if (line) {
      ensureSpace(lineHeight)
      currentPage.drawText(line, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      })
      currentY -= lineHeight + 20
    }
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}

/**
 * Convert EPUB into a Microsoft Word (.docx) document
 */
export async function convertEpubToDocx(epub: ParsedEpub): Promise<Blob> {
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

  let documentParagraphs = `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="107C41"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="107C41"/></w:rPr><w:t xml:space="preserve">${escapeXml(epub.metadata.title)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="555555"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="555555"/></w:rPr><w:t xml:space="preserve">By ${escapeXml(epub.metadata.creator)}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
  `

  for (let i = 0; i < epub.chapters.length; i++) {
    const ch = epub.chapters[i]
    documentParagraphs += `
      <w:p>
        <w:pPr><w:spacing w:before="360" w:after="160"/><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="222222"/></w:rPr></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="222222"/></w:rPr><w:t xml:space="preserve">${escapeXml(ch.title)}</w:t></w:r>
      </w:p>
    `

    // Split text into paragraphs
    const paras = ch.textContent.split(/\n\s*\n/)
    for (const p of paras) {
      if (!p.trim()) continue
      documentParagraphs += `
        <w:p>
          <w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="140"/></w:pPr>
          <w:r><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(p.trim())}</w:t></w:r>
        </w:p>
      `
    }

    if (i < epub.chapters.length - 1) {
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

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
