import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'

type AiGenerationOptions = {
  prompt: string
}

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

  const response = await requestOpenAiImage(trimmedPrompt)
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

async function requestOpenAiImage(prompt: string) {
  const url = `${env.OPENAI_API_BASE}/images/generations`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_IMAGE_MODEL,
      prompt,
      size: env.OPENAI_IMAGE_SIZE,
      quality: env.OPENAI_IMAGE_QUALITY,
      response_format: 'b64_json'
    })
  })

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>
    error?: { message?: string }
  }

  if (!response.ok) {
    const detail =
      payload.error?.message ??
      `${response.status} ${response.statusText}`.trim()
    throw new Error(`OpenAI image generation failed: ${detail}`)
  }

  const encoded = payload.data?.[0]?.b64_json
  if (!encoded) {
    throw new Error('OpenAI did not return image data')
  }

  const buffer = Buffer.from(encoded, 'base64')
  return {
    bytes: new Uint8Array(buffer),
    mimeType: 'image/png',
    model: env.OPENAI_IMAGE_MODEL
  }
}
