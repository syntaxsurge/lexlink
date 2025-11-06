import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'

type AiGenerationOptions = {
  prompt: string
}

const OPENAI_IMAGE_MAX_RETRIES = 5
const OPENAI_IMAGE_RETRY_DELAY_MS = 1000

export type AiGenerationResult = {
  bytes: Uint8Array
  mimeType: string
  prompt: string
  enhancedPrompt?: string
  model: string
  provider: string
  contentHash: `0x${string}`
}

export async function generateImageFromPrompt({
  prompt
}: AiGenerationOptions): Promise<AiGenerationResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Set it in your environment to enable AI generation.'
    )
  }

  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    throw new Error('Prompt is required to generate an asset')
  }

  const response = await requestOpenAiImageWithRetry(trimmedPrompt)
  const contentHash = sha256Hex(response.bytes)

  return {
    bytes: response.bytes,
    mimeType: response.mimeType,
    prompt: trimmedPrompt,
    model: response.model,
    provider: 'openai',
    contentHash
  }
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function requestOpenAiImageWithRetry(prompt: string) {
  for (let attempt = 0; attempt <= OPENAI_IMAGE_MAX_RETRIES; attempt++) {
    try {
      return await requestOpenAiImage(prompt)
    } catch (error) {
      if (attempt === OPENAI_IMAGE_MAX_RETRIES) {
        throw error
      }

      const delay = OPENAI_IMAGE_RETRY_DELAY_MS * (attempt + 1)
      console.warn(
        `OpenAI image generation failed on attempt ${attempt + 1}/${
          OPENAI_IMAGE_MAX_RETRIES + 1
        }. Retrying in ${delay}ms.`,
        error
      )
      await wait(delay)
    }
  }

  throw new Error('OpenAI image generation exhausted retries')
}

async function requestOpenAiImage(prompt: string) {
  const url = `${env.OPENAI_API_BASE}/images/generations`
  const requestBody: Record<string, unknown> = {
    model: env.OPENAI_IMAGE_MODEL,
    prompt
  }

  if (env.OPENAI_IMAGE_SIZE) {
    requestBody.size = env.OPENAI_IMAGE_SIZE
  }

  if (env.OPENAI_IMAGE_QUALITY) {
    requestBody.quality = env.OPENAI_IMAGE_QUALITY
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  })

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
    error?: { message?: string }
  }

  if (!response.ok) {
    const detail =
      payload.error?.message ??
      `${response.status} ${response.statusText}`.trim()
    throw new Error(`OpenAI image generation failed: ${detail}`)
  }

  const encoded = payload.data?.[0]?.b64_json
  const imageUrl = payload.data?.[0]?.url

  if (!encoded && !imageUrl) {
    throw new Error('OpenAI did not return image data')
  }

  if (imageUrl) {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from OpenAI URL')
    }

    const buffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') ?? 'image/png'

    return {
      bytes: new Uint8Array(buffer),
      mimeType: contentType,
      model: env.OPENAI_IMAGE_MODEL
    }
  }

  const base64 = encoded
  if (!base64) {
    throw new Error('OpenAI did not return encoded image data')
  }

  const buffer = Buffer.from(base64, 'base64')
  return {
    bytes: new Uint8Array(buffer),
    mimeType: 'image/png',
    model: env.OPENAI_IMAGE_MODEL
  }
}
