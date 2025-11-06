import { NextResponse } from 'next/server'

import { fileTypeFromBuffer } from 'file-type'
import { request } from 'undici'

const extensionLookup: Record<string, string> = {
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.oga': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string }
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    const target = normalizeUrl(url)

    const headMime = await detectViaHead(target)
    if (headMime) {
      return NextResponse.json({ mime: headMime, source: 'head' })
    }

    const sniffedMime = await detectViaSniff(target)
    if (sniffedMime) {
      return NextResponse.json({ mime: sniffedMime, source: 'sniff' })
    }

    const extMime = detectViaExtension(target)
    if (extMime) {
      return NextResponse.json({ mime: extMime, source: 'extension' })
    }

    return NextResponse.json({
      mime: 'application/octet-stream',
      source: 'default'
    })
  } catch (error) {
    console.error('[mime-api] detection failed', error)
    return NextResponse.json({
      mime: 'application/octet-stream',
      source: 'error'
    })
  }
}

function normalizeUrl(url: string) {
  if (url.startsWith('ipfs://')) {
    const cid = url.slice('ipfs://'.length)
    return `https://ipfs.io/ipfs/${cid}`
  }
  return url
}

async function detectViaHead(url: string) {
  try {
    const head = await request(url, { method: 'HEAD' })
    const contentType = head.headers['content-type']
    if (typeof contentType === 'string') {
      return sanitize(contentType)
    }
  } catch {
    // ignore and continue with other strategies
  }
  return null
}

async function detectViaSniff(url: string) {
  try {
    const response = await request(url, {
      method: 'GET',
      headers: { range: 'bytes=0-65535' }
    })
    if (!response.body) return null
    const buffer = Buffer.from(await response.body.arrayBuffer())
    if (buffer.length === 0) return null
    const fileType = await fileTypeFromBuffer(buffer)
    if (fileType?.mime) {
      return fileType.mime
    }
  } catch {
    // ignore and fall back
  }
  return null
}

function detectViaExtension(url: string) {
  const normalized = url.split('?')[0]?.split('#')[0] ?? ''
  const dotIndex = normalized.lastIndexOf('.')
  if (dotIndex === -1) return null
  const extension = normalized.slice(dotIndex).toLowerCase()
  return extensionLookup[extension] ?? null
}

function sanitize(contentType: string) {
  return contentType.split(';')[0]?.trim() ?? contentType.trim()
}
