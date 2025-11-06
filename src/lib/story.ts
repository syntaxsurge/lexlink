import { StoryClient, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { createWalletClient, http } from 'viem'
import type { Chain, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { env } from '@/lib/env'

let cachedClient: StoryClient | null = null
let cachedWallet: WalletClient | null = null

export const storyAccount = privateKeyToAccount(
  env.STORY_PRIVATE_KEY as `0x${string}`
)

export const storyChain: Chain = {
  id: env.STORY_CHAIN_ID,
  name:
    env.NEXT_PUBLIC_STORY_NETWORK === 'mainnet' ? 'Story Mainnet' : 'Story Aeneid',
  nativeCurrency: {
    name: 'Story',
    symbol: 'IP',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [env.STORY_RPC_URL]
    }
  }
}

export function getStoryClient() {
  if (!cachedClient) {
    cachedClient = StoryClient.newClient({
      chainId: 'aeneid',
      transport: http(env.STORY_RPC_URL),
      account: storyAccount
    })
  }

  patchLicenseNonceHandling(cachedClient)
  return cachedClient
}

export function getStoryWalletClient() {
  if (!cachedWallet) {
    cachedWallet = createWalletClient({
      account: storyAccount,
      chain: storyChain,
      transport: http(env.STORY_RPC_URL)
    })
  }
  return cachedWallet
}

function isNonceError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  if (!message) {
    return false
  }
  const normalized = message.toLowerCase()
  return normalized.includes('nonce') && (normalized.includes('lower') || normalized.includes('known'))
}

function patchLicenseNonceHandling(client: StoryClient) {
  const license = client.license as any
  const wallet = license.wallet as {
    account: { address: `0x${string}` }
    writeContract: (args: any) => Promise<unknown>
    __noncePatched?: boolean
  }
  if (wallet.__noncePatched) {
    return
  }

  const originalWrite = wallet.writeContract.bind(wallet)
  const signerAddress = wallet.account.address

  wallet.writeContract = async (args: any) => {
    try {
      return await originalWrite(args)
    } catch (error) {
      if (!isNonceError(error)) {
        throw error
      }
      const pendingNonce = await (license.rpcClient as any).getTransactionCount({
        address: signerAddress,
        blockTag: 'pending'
      })
      return await originalWrite({
        ...args,
        nonce: pendingNonce
      })
    }
  }

  wallet.__noncePatched = true
}

export function getDefaultLicenseTerms({
  commercialRevSharePercent,
  commercialUse,
  derivativesAllowed,
  defaultMintingFee
}: {
  commercialRevSharePercent: number
  commercialUse: boolean
  derivativesAllowed: boolean
  defaultMintingFee?: bigint | number
}) {
  const sharePercent = clampPercent(commercialRevSharePercent)
  const zeroAddress =
    '0x0000000000000000000000000000000000000000' as `0x${string}`
  const currency = WIP_TOKEN_ADDRESS as `0x${string}`

  return {
    transferable: true,
    commercialUse,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: '0x' as `0x${string}`,
    derivativesAllowed,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: false,
    currency,
    uri: env.STORY_PIL_URI,
    defaultMintingFee:
      typeof defaultMintingFee === 'number'
        ? BigInt(Math.max(defaultMintingFee, 0))
        : (defaultMintingFee ?? 0n),
    expiration: 0,
    commercialRevCeiling: 0,
    derivativeRevCeiling: 0,
    commercialRevShare: sharePercent
  }
}

export function getDefaultLicensingConfig({
  commercialRevSharePercent,
  mintingFee
}: {
  commercialRevSharePercent: number
  mintingFee?: bigint | number
}) {
  const sharePercent = clampPercent(commercialRevSharePercent)
  const zeroAddress =
    '0x0000000000000000000000000000000000000000' as `0x${string}`

  return {
    isSet: true,
    mintingFee:
      typeof mintingFee === 'number'
        ? BigInt(Math.max(mintingFee, 0))
        : (mintingFee ?? 0n),
    licensingHook: zeroAddress,
    hookData: '0x' as `0x${string}`,
    commercialRevShare: sharePercent,
    disabled: false,
    expectMinimumGroupRewardShare: 0,
    expectGroupRewardPool: zeroAddress
  }
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) {
    return 0
  }
  return Math.min(Math.max(value, 0), 100)
}
