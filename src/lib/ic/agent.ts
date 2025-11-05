import { HttpAgent, type Identity } from '@dfinity/agent'

const anonymousAgents = new Map<string, HttpAgent>()

function isLocalHost(url: string | undefined) {
  return !!url && (url.includes('127.0.0.1') || url.includes('localhost'))
}

export async function makeAgent(host: string, identity?: Identity) {
  if (!identity && anonymousAgents.has(host)) {
    return anonymousAgents.get(host) as HttpAgent
  }

  const agent = new HttpAgent({ host, identity })

  if (isLocalHost(host)) {
    await agent.fetchRootKey().catch(() => {
      console.warn('Unable to fetch ICP root key; ensure a local replica is running.')
    })
  }

  if (!identity) {
    anonymousAgents.set(host, agent)
  }

  return agent
}
