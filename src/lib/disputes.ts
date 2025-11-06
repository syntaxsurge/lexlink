import { uploadBytes, uploadJson } from '@/lib/ipfs'

const MAX_EVIDENCE_FILE_BYTES = 25 * 1024 * 1024 // 25 MB per attachment

export type DisputeEvidenceAttachment = {
  uri: `ipfs://${string}`
  name: string
  mimeType: string
  size: number
  source: 'upload' | 'url'
  originalUrl?: string
}

export type DisputeEvidenceBundle = {
  bundleCid: string
  bundleUri: `ipfs://${string}`
  note?: string
  attachments: DisputeEvidenceAttachment[]
}

export async function createDisputeEvidenceBundle({
  files,
  url,
  note
}: {
  files: File[]
  url?: string | null
  note?: string | null
}): Promise<DisputeEvidenceBundle> {
  const attachments: DisputeEvidenceAttachment[] = []

  for (const file of files) {
    if (!file || file.size === 0) {
      continue
    }

    if (file.size > MAX_EVIDENCE_FILE_BYTES) {
      throw new Error(
        `Attachment "${file.name}" exceeds the ${formatBytes(MAX_EVIDENCE_FILE_BYTES)} limit.`
      )
    }

    const name = sanitizeFileName(file.name || 'attachment')
    const mimeType = file.type || 'application/octet-stream'
    const bytes = new Uint8Array(await file.arrayBuffer())
    const uri = await uploadBytes(name, bytes)

    attachments.push({
      uri,
      name,
      mimeType,
      size: file.size,
      source: 'upload'
    })
  }

  const trimmedUrl = url?.trim()
  if (trimmedUrl) {
    const evidenceUrl = validateEvidenceUrl(trimmedUrl)
    const response = await fetch(evidenceUrl)

    if (!response.ok) {
      throw new Error(
        `Unable to fetch evidence URL (${response.status} ${response.statusText}).`
      )
    }

    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.byteLength > MAX_EVIDENCE_FILE_BYTES) {
      throw new Error(
        `Fetched evidence from URL exceeds the ${formatBytes(MAX_EVIDENCE_FILE_BYTES)} limit.`
      )
    }

    const derivedName = deriveFilenameFromUrl(evidenceUrl, contentType)
    const uri = await uploadBytes(derivedName, bytes)

    attachments.push({
      uri,
      name: derivedName,
      mimeType: contentType,
      size: bytes.byteLength,
      source: 'url',
      originalUrl: evidenceUrl
    })
  }

  if (attachments.length === 0) {
    throw new Error(
      'Add at least one attachment or URL so the arbitration policy has evidence to review.'
    )
  }

  const bundlePayload = {
    '@context': 'https://schema.lexlink.ai/disputes/1.0',
    createdAt: new Date().toISOString(),
    note: note?.trim() ? note.trim() : undefined,
    attachments: attachments.map(attachment => ({
      uri: attachment.uri,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      source: attachment.source,
      originalUrl: attachment.originalUrl
    }))
  }

  const { uri: bundleUri } = await uploadJson(
    `lexlink-dispute-${Date.now()}`,
    bundlePayload
  )

  const bundleCid = extractCid(bundleUri)
  return {
    bundleCid,
    bundleUri,
    note: bundlePayload.note,
    attachments
  }
}

export function extractCid(uriOrCid: string) {
  const trimmed = uriOrCid.trim()
  if (trimmed.startsWith('ipfs://')) {
    return trimmed.slice('ipfs://'.length)
  }
  if (trimmed.includes('/ipfs/')) {
    const [, cidPart] = trimmed.split('/ipfs/')
    return cidPart.split(/[/?#]/)[0]
  }
  return trimmed.split(/[/?#]/)[0]
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'attachment'
}

function deriveFilenameFromUrl(url: string, fallbackType: string) {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname
    const lastSegment = pathname.split('/').filter(Boolean).pop()
    if (!lastSegment) {
      return fallbackFilenameFromType(fallbackType)
    }
    const segment = decodeURIComponent(lastSegment)
    if (segment.includes('.')) {
      return sanitizeFileName(segment)
    }
    return sanitizeFileName(`${segment}${extensionFromType(fallbackType)}`)
  } catch {
    return sanitizeFileName(fallbackFilenameFromType(fallbackType))
  }
}

function fallbackFilenameFromType(mimeType: string) {
  return `evidence${extensionFromType(mimeType)}`
}

function extensionFromType(mimeType: string) {
  if (mimeType.includes('png')) return '.png'
  if (mimeType.includes('jpeg')) return '.jpg'
  if (mimeType.includes('jpg')) return '.jpg'
  if (mimeType.includes('gif')) return '.gif'
  if (mimeType.includes('mp4')) return '.mp4'
  if (mimeType.includes('pdf')) return '.pdf'
  if (mimeType.includes('json')) return '.json'
  if (mimeType.includes('plain')) return '.txt'
  return ''
}

function validateEvidenceUrl(raw: string) {
  try {
    const parsed = new URL(raw)
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error('Only HTTP(S) evidence URLs are supported.')
    }
    return parsed.toString()
  } catch {
    throw new Error('Provide a valid HTTP(S) evidence URL.')
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
