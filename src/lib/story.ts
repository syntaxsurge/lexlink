import { StoryClient, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { env } from '@/lib/env'

let cachedClient: StoryClient | null = null

export function getStoryClient() {
  if (!cachedClient) {
    const account = privateKeyToAccount(env.STORY_PRIVATE_KEY as `0x${string}`)
    cachedClient = StoryClient.newClient({
      chainId: 'aeneid',
      transport: http(env.STORY_RPC_URL),
      account
    })
  }
  return cachedClient
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
