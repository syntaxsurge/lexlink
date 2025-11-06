import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'

type AiGenerationOptions = {
  prompt: string
  enhancePrompt?: boolean
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
  prompt,
  enhancePrompt = true
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

  const enhancedPromptValue = enhancePrompt
    ? await maybeEnhancePrompt(trimmedPrompt)
    : trimmedPrompt

  const renderPrompt = enhancedPromptValue || trimmedPrompt
  const response = await requestOpenAiImage(renderPrompt)
  const contentHash = sha256Hex(response.bytes)

  return {
    bytes: response.bytes,
    mimeType: response.mimeType,
    prompt: trimmedPrompt,
    enhancedPrompt: renderPrompt !== trimmedPrompt ? renderPrompt : undefined,
    model: response.model,
    provider: 'openai',
    contentHash
  }
}

async function maybeEnhancePrompt(prompt: string) {
  if (!env.DEEPSEEK_API_KEY) {
    return prompt
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content:
              'You transform user prompts into short, vivid descriptions optimised for image generators. Keep outputs under 60 words.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(
        `Prompt enhancement failed: ${response.status} ${response.statusText}`
      )
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content?.trim()
    return content && content.length > 0 ? content : prompt
  } catch (error) {
    console.warn(
      '[ai] DeepSeek prompt enhancement error. Falling back to original prompt.',
      error
    )
    return prompt
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
