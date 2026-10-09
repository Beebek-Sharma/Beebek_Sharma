/**
 * Utility functions for Privacy-First Browser Tools
 * 100% Client-Side Processing
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatPercent(original: number, current: number): { percent: number; isSaved: boolean; text: string } {
  if (original <= 0 || current <= 0) return { percent: 0, isSaved: true, text: '0%' }
  const diff = original - current
  const percent = Math.round((diff / original) * 1000) / 10
  if (percent >= 0) {
    return { percent, isSaved: true, text: `-${percent.toFixed(1)}%` }
  } else {
    return { percent: Math.abs(percent), isSaved: false, text: `+${Math.abs(percent).toFixed(1)}%` }
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function revokeUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

let avifSupportCached: boolean | null = null

export function isAvifSupported(): boolean {
  if (avifSupportCached !== null) return avifSupportCached
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    avifSupportCached = canvas.toDataURL('image/avif').startsWith('data:image/avif')
  } catch {
    avifSupportCached = false
  }
  return avifSupportCached
}

export async function computeFileHash(file: File, algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256'): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\?%*:|"<>]/g, '_').trim()
}
