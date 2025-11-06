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

const DEFAULT_NETWORKS: Partial<Record<ConstellationNetwork, NetworkInfo>> = {
  integrationnet: {
    id: 'integrationnet',
    beUrl: 'https://be-integrationnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-integrationnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-integrationnet.constellationnetwork.io',
    networkVersion: '2.0',
    testnet: true
  }
}

function resolveNetworkInfo(): NetworkInfo {
  const network = env.CONSTELLATION_NETWORK
  const defaults = DEFAULT_NETWORKS[network]

  const beUrl = env.CONSTELLATION_BE_URL ?? defaults?.beUrl
  const l0Url = env.CONSTELLATION_L0_URL ?? defaults?.l0Url
  const l1Url = env.CONSTELLATION_L1_URL ?? defaults?.l1Url

  if (!beUrl || !l0Url || !l1Url) {
    throw new Error(
      `Missing Constellation endpoints for ${network}. Provide CONSTELLATION_BE_URL, CONSTELLATION_L0_URL, and CONSTELLATION_L1_URL.`
    )
  }

  return {
    id: network,
    beUrl,
    l0Url,
    l1Url,
    networkVersion: defaults?.networkVersion ?? '2.0',
    testnet: network !== 'mainnet'
  }
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
