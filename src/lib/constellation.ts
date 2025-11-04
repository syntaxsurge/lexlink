import { env } from '@/lib/env'

/**
 * Publish an evidence heartbeat to IntegrationNet.
 *
 * This function lazily imports dag4 to avoid bundling WASM in SSR paths.
 * If dag4 or WASM is unavailable at runtime, it returns a synthetic tx id so
 * the UI continues to function without crashing.
 */
const LOCAL_STORAGE_NAMESPACE = 'lexlink-evidence'

export async function publishEvidence(evidenceHash: string) {
  try {
    const { dag4 } = await import('@stardust-collective/dag4')
    const { LocalStorage } = await import('node-localstorage')

    if (typeof (globalThis as any).localStorage === 'undefined') {
      const localStorage = new LocalStorage('./lexlink-dag-cache')
      ;(globalThis as any).localStorage = localStorage as unknown as Storage
    }

    dag4.config({
      appId: 'lexlink',
      network: {
        id: env.BTC_NETWORK === 'mainnet' ? 'mainnet' : 'integrationnet',
        beUrl: env.CONSTELLATION_BE_URL,
        l0Url: env.CONSTELLATION_L0_URL,
        l1Url: env.CONSTELLATION_L1_URL,
        networkVersion: '2.0',
        testnet: env.BTC_NETWORK === 'testnet'
      }
    })

    dag4.account.loginPrivateKey(
      env.CONSTELLATION_PRIVATE_KEY.replace(/^0x/, '')
    )

    const account = dag4.account
    const lastRef = await dag4.network.getAddressLastAcceptedTransactionRef(
      env.CONSTELLATION_ADDRESS
    )
    const { transaction, hash: txHash } =
      await account.generateSignedTransactionWithHash(
        env.CONSTELLATION_ADDRESS,
        0,
        0,
        lastRef
      )

    const submittedHash = await dag4.network.postTransaction(transaction)
    await account.waitForCheckPointAccepted(submittedHash)
    if (typeof localStorage !== 'undefined') {
      const key = `${LOCAL_STORAGE_NAMESPACE}:${submittedHash ?? txHash}`
      localStorage.setItem(
        key,
        JSON.stringify({
          evidenceHash,
          recordedAt: new Date().toISOString()
        })
      )
    }
    return submittedHash ?? txHash
  } catch (err) {
    console.warn('Constellation evidence publishing skipped:', err)
    return `evidence-skipped-${Date.now()}`
  }
}
