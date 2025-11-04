'use server'

import crypto from 'node:crypto'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { publishEvidence } from '@/lib/constellation'
import { getConvexClient } from '@/lib/convex'
import { env } from '@/lib/env'
import {
  requestDepositAddress,
  confirmPayment,
  fetchAttestation
} from '@/lib/icp'
import {
  getStoryClient,
  getDefaultLicenseTerms,
  getDefaultLicensingConfig
} from '@/lib/story'

export type IpRecord = {
  ipId: string
  title: string
  creatorAddress: string
  priceSats: number
  royaltyBps: number
  licenseTermsId: string
  createdAt: number
}

export type LicenseRecord = {
  orderId: string
  ipId: string
  buyer: string
  btcAddress: string
  btcTxId: string
  attestationHash: string
  constellationTx: string
  tokenOnChainId: string
  licenseTermsId: string
  status: string
  createdAt: number
}

export type DisputeRecord = {
  disputeId: string
  ipId: string
  targetTag: DisputeTargetTag | string
  evidenceCid: string
  txHash: string
  evidenceHash: string
  constellationTx: string
  status: string
  livenessSeconds: number
  bond: number
  createdAt: number
}

type CreatorInput = {
  name: string
  address: `0x${string}`
  contributionPercent: number
}

export type RegisterIpPayload = {
  title: string
  description: string
  createdAt: string
  imageUrl: string
  mediaUrl: string
  mediaType: string
  creators: CreatorInput[]
  priceSats: number
  royaltyBps: number
  ipMetadataUri: string
  nftMetadataUri: string
}

function ensurePercent(creators: CreatorInput[]) {
  const total = creators.reduce(
    (sum, creator) => sum + creator.contributionPercent,
    0
  )
  if (Math.abs(total - 100) > 0.001) {
    throw new Error('Creator contributionPercent values must total 100')
  }
}

async function hashFromUrl(url: string): Promise<`0x${string}`> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    )
  }
  const arrayBuffer = await response.arrayBuffer()
  const hash = crypto
    .createHash('sha256')
    .update(Buffer.from(arrayBuffer))
    .digest('hex')
  return `0x${hash}` as const
}

export async function registerIpAsset(payload: RegisterIpPayload) {
  ensurePercent(payload.creators)

  const [ipMetadataHash, nftMetadataHash, imageHash, mediaHash] =
    await Promise.all([
      hashFromUrl(payload.ipMetadataUri),
      hashFromUrl(payload.nftMetadataUri),
      hashFromUrl(payload.imageUrl),
      hashFromUrl(payload.mediaUrl)
    ])

  const storyClient = getStoryClient()
  const licenseTerms = getDefaultLicenseTerms({
    royaltyBps: payload.royaltyBps
  })
  const licensingConfig = getDefaultLicensingConfig({
    royaltyBps: payload.royaltyBps
  })

  const registerResponse =
    await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: env.STORY_SPG_NFT_ADDRESS as `0x${string}`,
      allowDuplicates: false,
      ipMetadata: {
        ipMetadataURI: payload.ipMetadataUri,
        ipMetadataHash,
        nftMetadataURI: payload.nftMetadataUri,
        nftMetadataHash
      },
      licenseTermsData: [
        {
          terms: licenseTerms,
          licensingConfig
        }
      ]
    })

  if (!registerResponse.ipId || !registerResponse.licenseTermsIds?.length) {
    throw new Error('Story Protocol did not return an IP identifier')
  }

  const convex = getConvexClient()
  await convex.mutation('ipAssets:insert' as any, {
    ipId: registerResponse.ipId,
    title: payload.title,
    creatorAddress: payload.creators[0]?.address ?? env.STORY_SPG_NFT_ADDRESS,
    priceSats: payload.priceSats,
    royaltyBps: payload.royaltyBps,
    licenseTermsId: registerResponse.licenseTermsIds[0].toString()
  })

  return {
    ipId: registerResponse.ipId,
    tokenId: registerResponse.tokenId?.toString() ?? '',
    licenseTermsId: registerResponse.licenseTermsIds[0].toString(),
    ipMetadata: {
      hash: ipMetadataHash,
      uri: payload.ipMetadataUri
    },
    nftMetadata: {
      hash: nftMetadataHash,
      uri: payload.nftMetadataUri
    },
    assets: {
      imageHash,
      mediaHash
    }
  }
}

export async function createLicenseOrder({
  ipId,
  licenseTermsId,
  buyer
}: {
  ipId: string
  licenseTermsId: string
  buyer: string
}) {
  const orderId = crypto.randomUUID()
  const btcAddress = await requestDepositAddress(orderId)

  const convex = getConvexClient()
  await convex.mutation('licenses:insert' as any, {
    orderId,
    ipId,
    buyer,
    btcAddress,
    licenseTermsId
  })

  return { orderId, btcAddress }
}

export async function completeLicenseSale({
  orderId,
  btcTxId,
  receiver
}: {
  orderId: string
  btcTxId: string
  receiver: `0x${string}`
}) {
  const convex = getConvexClient()
  const order = (await convex.query('licenses:get' as any, {
    orderId
  })) as LicenseRecord | null

  if (!order) {
    throw new Error('License order not found')
  }

  await confirmPayment(orderId, btcTxId)
  const attestationJson = await fetchAttestation(orderId)

  const storyClient = getStoryClient()
  const mintResponse = await storyClient.license.mintLicenseTokens({
    licensorIpId: order.ipId as `0x${string}`,
    licenseTermsId: BigInt(order.licenseTermsId),
    licenseTemplate: env.STORY_LICENSE_TEMPLATE_ADDRESS as `0x${string}`,
    amount: 1,
    receiver,
    maxMintingFee: 0,
    maxRevenueShare: 100_000_000
  })

  if (!mintResponse.licenseTokenIds?.length) {
    throw new Error('Failed to mint license token on Story Protocol')
  }

  const attestationHash = `0x${crypto
    .createHash('sha256')
    .update(attestationJson)
    .digest('hex')}`

  const constellationTx = await publishEvidence(attestationHash)

  await convex.mutation('licenses:markCompleted' as any, {
    orderId,
    btcTxId,
    attestationHash,
    constellationTx,
    tokenOnChainId: mintResponse.licenseTokenIds[0].toString()
  })

  return {
    licenseTokenId: mintResponse.licenseTokenIds[0].toString(),
    attestation: JSON.parse(attestationJson),
    attestationHash,
    constellationTx
  }
}

export type RaiseDisputePayload = {
  ipId: string
  evidenceCid: string
  targetTag: DisputeTargetTag
  livenessSeconds?: number
  bond?: number
}

export async function raiseDispute(payload: RaiseDisputePayload) {
  const storyClient = getStoryClient()
  const livenessSeconds =
    payload.livenessSeconds && payload.livenessSeconds > 0
      ? payload.livenessSeconds
      : 60 * 60 * 24 * 3

  const response = await storyClient.dispute.raiseDispute({
    targetIpId: payload.ipId as `0x${string}`,
    cid: payload.evidenceCid,
    targetTag: payload.targetTag,
    liveness: BigInt(livenessSeconds),
    bond: payload.bond && payload.bond > 0 ? BigInt(payload.bond) : undefined
  })

  const disputeId =
    response.disputeId?.toString() ?? `pending-${crypto.randomUUID()}`
  const txHash = response.txHash ?? ''

  const evidencePayload = JSON.stringify({
    kind: 'DISPUTE_RAISED',
    disputeId,
    ipId: payload.ipId,
    targetTag: payload.targetTag,
    evidenceCid: payload.evidenceCid,
    livenessSeconds,
    bond: payload.bond ?? 0,
    txHash,
    timestamp: Date.now()
  })

  const evidenceHash = `0x${crypto
    .createHash('sha256')
    .update(evidencePayload)
    .digest('hex')}`

  const constellationTx = await publishEvidence(evidenceHash)

  const convex = getConvexClient()
  await convex.mutation('disputes:insert' as any, {
    disputeId,
    ipId: payload.ipId,
    targetTag: payload.targetTag,
    evidenceCid: payload.evidenceCid,
    txHash,
    evidenceHash,
    constellationTx,
    status: 'raised',
    livenessSeconds,
    bond: payload.bond ?? 0
  })

  return {
    disputeId,
    txHash,
    evidenceHash,
    constellationTx
  }
}

export async function loadDashboardData() {
  const convex = getConvexClient()
  const [ipsRaw, licensesRaw, disputesRaw] = await Promise.all([
    convex.query('ipAssets:list' as any, {}),
    convex.query('licenses:list' as any, {}),
    convex.query('disputes:list' as any, {})
  ])

  return {
    ips: ipsRaw as IpRecord[],
    licenses: licensesRaw as LicenseRecord[],
    disputes: disputesRaw as DisputeRecord[]
  }
}

// Note: do not export non-function values from a `use server` module.
