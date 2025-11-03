import { ConvexHttpClient } from 'convex/browser'

import { env } from '@/lib/env'

let client: ConvexHttpClient | null = null

export function getConvexClient() {
  if (!client) {
    client = new ConvexHttpClient(env.CONVEX_URL)
  }
  return client
}
