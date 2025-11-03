import { dag4 } from '@stardust-collective/dag4'
import { LocalStorage } from 'node-localstorage'

import { env } from '@/lib/env'

declare global {
  var localStorage: Storage
}

if (typeof globalThis.localStorage === 'undefined') {
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

dag4.account.loginPrivateKey(env.CONSTELLATION_PRIVATE_KEY.replace(/^0x/, ''))

export async function publishEvidence(_hash: string) {
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

  // Wait for settlement to avoid race conditions on follow-up reads
  await account.waitForCheckPointAccepted(submittedHash)

  return submittedHash ?? txHash
}
