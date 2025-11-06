import { env } from '@/lib/env'

type ConstellationNetwork =
  | 'integrationnet'
  | 'testnet'
  | 'mainnet'

type NetworkInfo = {
  id: ConstellationNetwork
  beUrl: string
  l0Url: string
  l1Url: string
  networkVersion: string
  testnet: boolean
}

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
 * Publishes an evidence heartbeat to Constellation.
 *
 * The dag4 SDK requires a localStorage instance and its WASM compression
 * dependency. Both are polyfilled lazily so server routes can call this helper
 * without bundling failures.
 */
export async function publishEvidence(evidenceHash: string): Promise<string> {
  if (!env.CONSTELLATION_ENABLED) {
    return `constellation-disabled-${Date.now()}`
  }

  // dag4 internally pulls brotli-wasm. Preloading prevents missing asset errors.
  try {
    await import('brotli-wasm')
  } catch (error) {
    console.warn('Constellation brotli preload failed:', error)
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

    const storage = (globalThis as any).localStorage as
      | Storage
      | undefined

    dag4.config({
      appId: 'lexlink',
      network: resolveNetworkInfo()
    })

    dag4.account.loginPrivateKey(
      env.CONSTELLATION_PRIVATE_KEY.replace(/^0x/, '')
    )

    const fromAddress = dag4.account.address
    if (fromAddress !== env.CONSTELLATION_ADDRESS) {
      console.warn(
        `Constellation signer address mismatch (configured ${env.CONSTELLATION_ADDRESS}, derived ${fromAddress}).`
      )
    }

    const toAddress = env.CONSTELLATION_SINK_ADDRESS
    if (toAddress === fromAddress) {
      console.warn('Constellation anchoring skipped: sink equals source.')
      return `constellation-skipped-self-send-${Date.now()}`
    }

    const lastRef =
      await dag4.network.getAddressLastAcceptedTransactionRef(fromAddress)

    const {
      transaction,
      hash: txHash
    } = await dag4.account.generateSignedTransactionWithHash(
      toAddress,
      0,
      0,
      lastRef
    )

    const submittedHash = await dag4.network.postTransaction(transaction)
    if (submittedHash) {
      await dag4.account.waitForCheckPointAccepted(submittedHash)
    }

    const reference = submittedHash ?? txHash ?? ''
    if (reference && storage) {
      storage.setItem(
        `${LOCAL_STORAGE_NAMESPACE}:${reference}`,
        JSON.stringify({
          evidenceHash,
          recordedAt: new Date().toISOString(),
          from: fromAddress,
          to: toAddress
        })
      )
    }

    return reference || `constellation-pending-${Date.now()}`
  } catch (error) {
    console.warn('Constellation evidence publishing skipped:', error)
    return `constellation-skipped-${Date.now()}`
  }
}
