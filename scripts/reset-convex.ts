#!/usr/bin/env tsx

import { ConvexHttpClient } from 'convex/browser'

import { api } from '../convex/_generated/api'

function resolveConvexUrl(): string {
  const candidates = [
    process.env.CONVEX_DEPLOYMENT_URL,
    process.env.CONVEX_DEPLOYMENT,
    process.env.NEXT_PUBLIC_CONVEX_URL
  ]

  const url = candidates.find(
    value => typeof value === 'string' && value.trim().length > 0
  )
  if (!url) {
    throw new Error(
      'Set CONVEX_DEPLOYMENT_URL (recommended) or NEXT_PUBLIC_CONVEX_URL before running the reset script.'
    )
  }

  const normalized = url.trim()
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  if (normalized.startsWith('dev:')) {
    return process.env.NEXT_PUBLIC_CONVEX_URL ?? 'http://127.0.0.1:8000'
  }

  throw new Error(
    `Unsupported Convex deployment value "${normalized}". Provide an https:// URL or a dev deployment string (dev:).`
  )
}

async function main() {
  const url = resolveConvexUrl()
  const client = new ConvexHttpClient(url)

  console.log(`Resetting Convex deployment at ${url}…`)
  const secret = process.env.CONVEX_RESET_TOKEN
  const result = (await client.action(api.admin.truncateAll, {
    secret
  })) as Record<string, number>

  console.log('Truncated tables:')
  for (const [table, count] of Object.entries(result)) {
    console.log(`- ${table}: ${count} rows deleted`)
  }

  console.log('Convex deployment reset complete.')
}

main().catch(error => {
  console.error('Failed to reset Convex deployment:', error)
  process.exitCode = 1
})
