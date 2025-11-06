import { env } from '@/lib/env'
import { IPFS_GATEWAYS } from '@/lib/ipfs-gateways'

const PIN_FILE_PATH = '/pinning/pinFileToIPFS'
const PIN_JSON_PATH = '/pinning/pinJSONToIPFS'

type PinataUploadResponse = {
  IpfsHash?: string
  ipfsHash?: string
}

export async function uploadBytes(name: string, bytes: Uint8Array) {
  ensurePinataAuth()

  const normalizedName = sanitizeName(name)
  const payload = new Uint8Array(bytes)
  const blob = new Blob([payload.buffer], { type: 'application/octet-stream' })

  const formData = new FormData()
  formData.append('file', blob, normalizedName)
  formData.append('pinataMetadata', JSON.stringify({ name: normalizedName }))

  const response = await fetch(resolveApiUrl(PIN_FILE_PATH), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`
    },
    body: formData
  })

  const cid = await parsePinataCid(response)
  return `ipfs://${cid}` as const
}

export async function uploadJson(
  name: string,
  payload: string | Record<string, unknown>
) {
  ensurePinataAuth()

  const normalizedName = sanitizeName(name)
  const contentObject =
    typeof payload === 'string' ? parseJsonPayload(payload) : payload
  const jsonString = JSON.stringify(contentObject)
  const bytes = new TextEncoder().encode(jsonString)

  const response = await fetch(resolveApiUrl(PIN_JSON_PATH), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pinataMetadata: { name: normalizedName },
      pinataContent: contentObject
    })
  })

  const cid = await parsePinataCid(response)
  return {
    uri: `ipfs://${cid}` as const,
    bytes
  }
}

export function ipfsGatewayUrl(uri: string) {
  if (!uri.startsWith('ipfs://')) {
    return uri
  }

  const cidPath = uri.replace('ipfs://', '')
  const defaultGateway = env.PINATA_GATEWAY?.replace(/\/$/, '')
  if (defaultGateway) {
    return `${defaultGateway}/ipfs/${cidPath}`
  }

  return `${IPFS_GATEWAYS[0]}${cidPath}`
}

function sanitizeName(value: string) {
  const trimmed = value.trim() || 'asset'
  return trimmed.slice(0, 255)
}

function resolveApiUrl(path: string) {
  const base = env.PINATA_API_URL.replace(/\/$/, '')
  return `${base}${path}`
}

function ensurePinataAuth() {
  if (!env.PINATA_JWT) {
    throw new Error('PINATA_JWT is not configured in the environment')
  }
}

async function parsePinataCid(response: Response) {
  if (!response.ok) {
    const detail = await safeReadText(response)
    throw new Error(
      `Pinata upload failed (${response.status} ${response.statusText}): ${detail}`
    )
  }

  const payload = (await response.json()) as PinataUploadResponse
  const cid = payload.IpfsHash ?? payload.ipfsHash

  if (!cid) {
    throw new Error('Pinata upload succeeded but no CID was returned')
  }

  return cid
}

async function safeReadText(response: Response) {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function parseJsonPayload(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid JSON string payload'
    throw new Error(`uploadJson received invalid JSON string: ${message}`)
  }
}
