import { HttpAgent, type Identity } from '@dfinity/agent'

import { env } from '@/lib/env'

let cachedAnonymousAgent: HttpAgent | null = null

function isLocalHost(url: string | undefined) {
  return !!url && (url.includes('127.0.0.1') || url.includes('localhost'))
}

export async function makeAgent(identity?: Identity) {
  if (!identity && cachedAnonymousAgent) {
    return cachedAnonymousAgent
  }

  const agent = new HttpAgent({
    host: env.ICP_HOST,
    identity
  })

  if (isLocalHost(env.ICP_HOST)) {
    await agent.fetchRootKey().catch(() => {
      console.warn('Unable to fetch ICP root key; ensure a local replica is running.')
    })
  }

  if (!identity) {
    cachedAnonymousAgent = agent
  }

  return agent
}
