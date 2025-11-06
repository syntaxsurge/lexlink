import { env } from '@/lib/env'

type ConstellationNetwork = 'integrationnet' | 'testnet' | 'mainnet'

type NetworkInfo = {
  id: ConstellationNetwork
  beUrl: string
  l0Url: string
  l1Url: string
  networkVersion: string
  testnet: boolean
}

export type EvidenceResult =
  | { status: 'disabled'; reason: string }
  | { status: 'skipped'; reason: string }
  | { status: 'ok'; txHash: string }

const LOCAL_STORAGE_NAMESPACE = 'lexlink-evidence'
const DAG_CACHE_PATH = './lexlink-dag-cache'

const DEFAULT_NETWORKS: Record<ConstellationNetwork, NetworkInfo> = {
  integrationnet: {
    id: 'integrationnet',
    beUrl: 'https://be-integrationnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-integrationnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-integrationnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: true
  },
  testnet: {
    id: 'testnet',
    beUrl: 'https://be-testnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-testnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-testnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: true
  },
  mainnet: {
    id: 'mainnet',
    beUrl: 'https://be-mainnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-mainnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-mainnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: false
  }
}

function resolveNetworkInfo(): NetworkInfo {
  const network = env.CONSTELLATION_NETWORK
  const defaults = DEFAULT_NETWORKS[network]

  if (!defaults) {
    throw new Error(`Unsupported Constellation network "${network}".`)
  }

  return defaults
}

/**
 * Publishes an evidence heartbeat to Constellation. Returns a structured result so
 * callers can treat anchoring as best-effort without throwing.
 */
export async function publishEvidence(
  evidence: unknown
): Promise<EvidenceResult> {
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
    console.warn('Constellation anchoring skipped: sink equals source.')
    return { status: 'skipped', reason: 'sink_equals_source' }
  }

  try {
    const [{ dag4 }, { LocalStorage }] = await Promise.all([
      import('@stardust-collective/dag4'),
      import('node-localstorage')
    ])

    if (typeof (globalThis as any).localStorage === 'undefined') {
      const storage = new LocalStorage(DAG_CACHE_PATH)
      ;(globalThis as any).localStorage = storage as unknown as Storage
    }

    const storage = (globalThis as any).localStorage as Storage | undefined
    const networkInfo = resolveNetworkInfo()
    const message =
      typeof evidence === 'string'
        ? evidence
        : JSON.stringify(evidence, null, 2)

    const evidenceHashValue =
      typeof evidence === 'string'
        ? evidence
        : typeof evidence === 'object' &&
            evidence !== null &&
            'evidenceHash' in evidence &&
            typeof (evidence as Record<string, unknown>).evidenceHash === 'string'
          ? ((evidence as Record<string, unknown>).evidenceHash as string)
          : undefined

    if (!message || message.length === 0) {
      return { status: 'skipped', reason: 'empty_payload' }
    }

    if (Buffer.byteLength(message, 'utf8') > 60_000) {
      throw new Error(
        'Evidence payload exceeds Constellation memo size (~60KB).'
      )
    }

    dag4.account.connect(
      {
        id: networkInfo.id,
        networkVersion: networkInfo.networkVersion,
        beUrl: networkInfo.beUrl,
        l0Url: networkInfo.l0Url,
        l1Url: networkInfo.l1Url
      },
      false
    )

    dag4.account.loginPrivateKey(privateKey.replace(/^0x/, ''))

    const derivedAddress = dag4.account.address
    if (derivedAddress !== sourceAddress) {
      console.warn(
        `Constellation signer address mismatch (configured ${sourceAddress}, derived ${derivedAddress}).`
      )
    }

    const transferResult = await (dag4.account as any).transferDag({
      toAddress: sinkAddress,
      amount: '0.0000001',
      fee: '0',
      message
    })

    const txHash =
      typeof transferResult === 'string'
        ? transferResult
        : transferResult?.hash ?? ''

    if (!txHash) {
      return { status: 'skipped', reason: 'missing_tx_hash' }
    }

    if (typeof dag4.account.waitForCheckPointAccepted === 'function') {
      await dag4.account.waitForCheckPointAccepted(txHash)
    }

    if (storage) {
      storage.setItem(
        `${LOCAL_STORAGE_NAMESPACE}:${txHash}`,
        JSON.stringify({
          recordedAt: new Date().toISOString(),
          from: derivedAddress,
          to: sinkAddress,
          network: networkInfo.id,
          payloadPreview: message.slice(0, 256),
          ...(evidenceHashValue
            ? { evidenceHash: evidenceHashValue }
            : {})
        })
      )
    }

    return { status: 'ok', txHash }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'unknown')
    console.warn('Constellation evidence publishing skipped:', error)
    return { status: 'skipped', reason: message }
  }
}
