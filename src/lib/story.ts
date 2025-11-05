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

export function getDefaultLicenseTerms({ royaltyBps }: { royaltyBps: number }) {
  const commercialRevShare = Math.min(royaltyBps, 10_000) / 100

  const zeroAddress =
    '0x0000000000000000000000000000000000000000' as `0x${string}`
  const currency = WIP_TOKEN_ADDRESS as `0x${string}`

  return {
    transferable: true,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: zeroAddress,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: false,
    currency,
    uri: env.STORY_PIL_URI,
    defaultMintingFee: 0,
    expiration: 0,
    commercialRevCeiling: 0,
    derivativeRevCeiling: 0,
    commercialRevShare
  }
}

export function getDefaultLicensingConfig({
  royaltyBps
}: {
  royaltyBps: number
}) {
  const commercialRevShare = Math.min(royaltyBps, 10_000) / 100

  const zeroAddress =
    '0x0000000000000000000000000000000000000000' as `0x${string}`

  return {
    isSet: true,
    mintingFee: 0,
    licensingHook: zeroAddress,
    hookData: '0x' as `0x${string}`,
    commercialRevShare,
    disabled: false,
    expectMinimumGroupRewardShare: 0,
    expectGroupRewardPool: zeroAddress
  }
}
