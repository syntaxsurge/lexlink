import { dag4 } from '@stardust-collective/dag4'

import { env } from '@/lib/env'

type ConstellationNetwork = 'integrationnet' | 'testnet' | 'mainnet'

type NetworkConfig = {
  beUrl: string
  l0Url: string
  l1Url: string
  explorerUrl: string
  networkVersion: '2.0'
  testnet: boolean
}

export type EvidenceResult =
  | { status: 'disabled'; reason: string }
  | { status: 'skipped'; reason: string }
  | { status: 'ok'; txHash: string; explorerUrl: string }

const NETWORKS: Record<ConstellationNetwork, NetworkConfig> = {
  integrationnet: {
    beUrl: 'https://be-integrationnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-integrationnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-integrationnet.constellationnetwork.io',
    explorerUrl: 'https://explorer.integrationnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: true
  },
  testnet: {
    beUrl: 'https://be-testnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-testnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-testnet.constellationnetwork.io',
    explorerUrl: 'https://explorer.testnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: true
  },
  mainnet: {
    beUrl: 'https://be-mainnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-mainnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-mainnet.constellationnetwork.io',
    explorerUrl: 'https://explorer.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: false
  }
}

export const runtime = 'nodejs'

const MAX_MEMO_BYTES = 60_000
const DEFAULT_TIMEOUT = 60_000
const POLL_INTERVAL = 2_000

function resolveNetworkConfig(): NetworkConfig {
  const config = NETWORKS[env.CONSTELLATION_NETWORK]
  if (!config) {
    throw new Error(`Unsupported Constellation network "${env.CONSTELLATION_NETWORK}".`)
  }
  return config
}

function isNonceLikeError(error: unknown) {
  if (!error) {
    return false
  }
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  if (!message) {
    return false
  }
  const normalized = message.toLowerCase()
  return normalized.includes('nonce') && (normalized.includes('lower') || normalized.includes('known'))
}

async function waitForAcceptance(txHash: string, config: NetworkConfig) {
  const deadline = Date.now() + DEFAULT_TIMEOUT
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${config.beUrl}/transactions/${txHash}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const payload = await response.json().catch(() => null)
        if (
          payload &&
          (payload.hash ||
            payload.transaction ||
            payload.depth >= 0 ||
            payload.accepted ||
            payload.status === 'Accepted')
        ) {
          return
        }
      }
    } catch (error) {
      console.warn('[Constellation] Polling error while awaiting acceptance:', error)
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
  }
  throw new Error('Timed out waiting for Constellation transaction acceptance')
}

export async function publishEvidence(evidence: unknown): Promise<EvidenceResult> {
  if (!env.CONSTELLATION_ENABLED) {
    return { status: 'disabled', reason: 'constellation_disabled' }
  }

  const sinkAddress = env.CONSTELLATION_SINK_ADDRESS
  const sourceAddress = env.CONSTELLATION_ADDRESS
  const privateKey = env.CONSTELLATION_PRIVATE_KEY

  if (!sinkAddress || !sourceAddress || !privateKey) {
    return { status: 'skipped', reason: 'missing_configuration' }
  }

  if (sinkAddress === sourceAddress) {
    console.warn('[Constellation] Skipping: sink address matches source address.')
    return { status: 'skipped', reason: 'sink_equals_source' }
  }

  const networkConfig = resolveNetworkConfig()
  const memo =
    typeof evidence === 'string'
      ? evidence
      : evidence
        ? JSON.stringify(evidence)
        : ''

  if (!memo) {
    return { status: 'skipped', reason: 'empty_payload' }
  }

  if (Buffer.byteLength(memo, 'utf8') > MAX_MEMO_BYTES) {
    return { status: 'skipped', reason: 'payload_too_large' }
  }

  console.log(`[Constellation] Connecting to ${env.CONSTELLATION_NETWORK}...`)
  const networkInfo = {
    id: env.CONSTELLATION_NETWORK,
    beUrl: networkConfig.beUrl,
    l0Url: networkConfig.l0Url,
    l1Url: networkConfig.l1Url,
    networkVersion: networkConfig.networkVersion
  }

  dag4.network.config(networkInfo)
  dag4.account.connect(networkInfo, networkConfig.testnet)

  console.log('[Constellation] Authenticating with private key...')
  dag4.account.loginPrivateKey(privateKey.replace(/^0x/, ''))

  const derivedAddress = dag4.account.address
  if (derivedAddress !== sourceAddress) {
    console.warn(
      `[Constellation] Address mismatch. Derived ${derivedAddress}, expected ${sourceAddress}.`
    )
  }

  try {
    console.log(`[Constellation] Sending memo to ${sinkAddress} (${Buffer.byteLength(memo, 'utf8')} bytes)...`)
    const { transaction, hash } = await dag4.account.generateSignedTransactionWithHash(
      sinkAddress,
      0,
      0,
      memo
    )

    const response: any = await dag4.network.postTransaction(
      transaction as any
    )
    const txHash =
      typeof response === 'string' ? response : response?.hash ?? hash

    if (!txHash) {
      console.error('[Constellation] Missing transaction hash in response.', response)
      return { status: 'skipped', reason: 'missing_tx_hash' }
    }

    await waitForAcceptance(txHash, networkConfig)

    const explorerUrl = `${networkConfig.explorerUrl}/transactions/${txHash}`
    console.log(`[Constellation] ✅ Evidence anchored: ${txHash}`)
    return { status: 'ok', txHash, explorerUrl }
  } catch (error) {
    if (isNonceLikeError(error)) {
      console.error('[Constellation] Nonce error encountered when anchoring evidence.', error)
    } else {
      console.error('[Constellation] ❌ Publishing failed:', error)
    }
    const message = error instanceof Error ? error.message : String(error ?? 'unknown_error')
    return { status: 'skipped', reason: message }
  }
}
