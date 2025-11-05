import { env } from '@/lib/env'

const DEFAULT_WEB3_STORAGE_ENDPOINT = 'https://api.web3.storage/upload'

type Web3UploadResponse = {
  cid?: string
  value?: {
    cid?: string
  }
}

export async function uploadBytes(name: string, bytes: Uint8Array) {
  const normalizedName = name.trim() || 'asset'
  const endpoint = env.WEB3_STORAGE_ENDPOINT ?? DEFAULT_WEB3_STORAGE_ENDPOINT

  const normalizedBytes = new Uint8Array(bytes)
  const blob = new Blob([normalizedBytes.buffer], {
    type: 'application/octet-stream'
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WEB3_STORAGE_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'X-Name': normalizedName
    },
    body: blob
  })

  if (!response.ok) {
    const detail = await safeReadText(response)
    throw new Error(
      `IPFS upload failed (${response.status} ${response.statusText}): ${detail}`
    )
  }

  const payload = (await response.json()) as Web3UploadResponse
  const cid = payload.cid ?? payload.value?.cid
  if (!cid) {
    throw new Error('IPFS upload succeeded but no CID was returned')
  }

  return `ipfs://${cid}` as const
}

export async function uploadJson(
  name: string,
  payload: string | Record<string, unknown>
) {
  const jsonString =
    typeof payload === 'string' ? payload : JSON.stringify(payload)
  const bytes = new TextEncoder().encode(jsonString)
  return {
    uri: await uploadBytes(name, bytes),
    bytes
  }
}

export function ipfsGatewayUrl(uri: string) {
  if (!uri.startsWith('ipfs://')) {
    return uri
  }
  const gateway = env.WEB3_STORAGE_GATEWAY.replace(/\/$/, '')
  const cidPath = uri.replace('ipfs://', '')
  return `${gateway}/${cidPath}`
}

async function safeReadText(response: Response) {
  try {
    return await response.text()
  } catch {
    return ''
  }
}
