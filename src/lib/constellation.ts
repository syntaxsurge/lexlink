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
  evidenceHash: string
): Promise<EvidenceResult> {
  if (!env.CONSTELLATION_ENABLED) {
    return { status: 'disabled', reason: 'constellation_disabled' }
  }

  const sinkAddress = env.CONSTELLATION_SINK_ADDRESS
  const sourceAddress = env.CONSTELLATION_ADDRESS

  if (!sinkAddress || !sourceAddress) {
    return { status: 'skipped', reason: 'missing_addresses' }
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

    dag4.config({
      appId: 'lexlink',
      network: networkInfo
    })

    dag4.account.connect(networkInfo)
    dag4.account.loginPrivateKey(
      env.CONSTELLATION_PRIVATE_KEY.replace(/^0x/, '')
    )

    const derivedAddress = dag4.account.address
    if (derivedAddress !== sourceAddress) {
      console.warn(
        `Constellation signer address mismatch (configured ${sourceAddress}, derived ${derivedAddress}).`
      )
    }

    const lastRef =
      await dag4.network.getAddressLastAcceptedTransactionRef(derivedAddress)

    const { transaction, hash } =
      await dag4.account.generateSignedTransactionWithHash(
        sinkAddress,
        0,
        0,
        lastRef
      )

    const submittedHash = await dag4.network.postTransaction(transaction)
    const reference = submittedHash ?? hash ?? ''

    if (submittedHash) {
      await dag4.account.waitForCheckPointAccepted(submittedHash)
    }

    if (reference && storage) {
      storage.setItem(
        `${LOCAL_STORAGE_NAMESPACE}:${reference}`,
        JSON.stringify({
          evidenceHash,
          recordedAt: new Date().toISOString(),
          from: derivedAddress,
          to: sinkAddress,
          network: networkInfo.id
        })
      )
    }

    if (!reference) {
      return { status: 'skipped', reason: 'missing_reference' }
    }

    return { status: 'ok', txHash: reference }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'unknown')
    console.warn('Constellation evidence publishing skipped:', error)
    return { status: 'skipped', reason: message }
  }
}
