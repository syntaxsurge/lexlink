'use server'

import crypto from 'node:crypto'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { createLicenseArchive } from '@/lib/c2pa'
import { publishEvidence } from '@/lib/constellation'
import { getConvexClient } from '@/lib/convex'
import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'
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
import { generateLicenseCredential } from '@/lib/vc'

export type IpRecord = {
  ipId: string
  title: string
  creatorAddress: string
  priceSats: number
  royaltyBps: number
  licenseTermsId: string
  description: string
  createdAt: number
  imageUrl: string
  mediaUrl: string
  mediaType: string
  ipMetadataUri: string
  nftMetadataUri: string
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
  contentHash: string
  c2paHash: string
  c2paArchive: string
  vcDocument: string
  vcHash: string
  complianceScore: number
  trainingUnits: number
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

export type TrainingBatchRecord = {
  batchId: string
  ipId: string
  units: number
  evidenceHash: string
  constellationTx: string
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

function calculateComplianceScore({
  hasPayment,
  hasLicenseToken,
  hasConstellationEvidence,
  hasC2paArchive,
  trainingUnits
}: {
  hasPayment: boolean
  hasLicenseToken: boolean
  hasConstellationEvidence: boolean
  hasC2paArchive: boolean
  trainingUnits: number
}) {
  let score = 0
  if (hasPayment) score += 25
  if (hasLicenseToken) score += 25
  if (hasC2paArchive) score += 25
  if (hasConstellationEvidence) score += 25
  const trainingBonus = Math.min(25, trainingUnits)
  return Math.min(100, score + trainingBonus)
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
    licenseTermsId: registerResponse.licenseTermsIds[0].toString(),
    description: payload.description,
    imageUrl: payload.imageUrl,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType,
    ipMetadataUri: payload.ipMetadataUri,
    nftMetadataUri: payload.nftMetadataUri
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

  const ip = (await convex.query('ipAssets:getById' as any, {
    ipId: order.ipId
  })) as IpRecord | null
  if (!ip) {
    throw new Error('Associated IP asset not found')
  }

  await confirmPayment(orderId, btcTxId)
  const attestationJson = await fetchAttestation(orderId)
  const attestation = JSON.parse(attestationJson)
  const attestationHash = sha256Hex(attestationJson)

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

  const licenseTokenId = mintResponse.licenseTokenIds[0].toString()

  const mediaResponse = await fetch(ip.mediaUrl)
  if (!mediaResponse.ok) {
    throw new Error(
      `Failed to fetch media for IP: ${mediaResponse.status} ${mediaResponse.statusText}`
    )
  }
  const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer())
  const contentHash = sha256Hex(mediaBuffer)

  const evidencePayload = JSON.stringify({
    kind: 'LICENSE_COMPLETED',
    orderId,
    ipId: order.ipId,
    licenseTokenId,
    btcTxId,
    attestationHash,
    contentHash,
    timestamp: Date.now()
  })
  const evidenceHash = sha256Hex(evidencePayload)
  const constellationTx = await publishEvidence(evidenceHash)

  const archive = await createLicenseArchive({
    assetBuffer: mediaBuffer,
    assetFileName:
      new URL(ip.mediaUrl).pathname.split('/').pop() ?? 'licensed-asset.bin',
    storyLicenseId: licenseTokenId,
    btcTxId,
    constellationTx,
    attestationHash,
    contentHash,
    licenseTokenId
  })

  const vc = await generateLicenseCredential({
    subjectId: `did:pkh:eip155:${env.STORY_CHAIN_ID}:${receiver.toLowerCase()}`,
    storyLicenseId: licenseTokenId,
    btcTxId,
    constellationTx,
    contentHash,
    attestationHash
  })
  const vcJson = JSON.stringify(vc.document, null, 2)

  const complianceScore = calculateComplianceScore({
    hasPayment: true,
    hasLicenseToken: true,
    hasConstellationEvidence: Boolean(constellationTx),
    hasC2paArchive: Boolean(archive.archiveBase64),
    trainingUnits: 0
  })

  await convex.mutation('licenses:markCompleted' as any, {
    orderId,
    btcTxId,
    attestationHash,
    constellationTx,
    tokenOnChainId: licenseTokenId,
    contentHash,
    c2paHash: archive.archiveHash,
    c2paArchive: archive.archiveBase64,
    vcDocument: vcJson,
    vcHash: vc.hash,
    complianceScore
  })

  return {
    licenseTokenId,
    attestation,
    attestationHash,
    constellationTx,
    contentHash,
    complianceScore,
    c2paArchive: {
      base64: archive.archiveBase64,
      fileName: archive.suggestedFileName,
      hash: archive.archiveHash
    },
    vcDocument: vcJson,
    vcHash: vc.hash
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

  const evidenceHash = sha256Hex(evidencePayload)

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
  const [ipsRaw, licensesRaw, disputesRaw, trainingRaw] = await Promise.all([
    convex.query('ipAssets:list' as any, {}),
    convex.query('licenses:list' as any, {}),
    convex.query('disputes:list' as any, {}),
    convex.query('trainingBatches:list' as any, {})
  ])

  return {
    ips: ipsRaw as IpRecord[],
    licenses: licensesRaw as LicenseRecord[],
    disputes: disputesRaw as DisputeRecord[],
    trainingBatches: trainingRaw as TrainingBatchRecord[]
  }
}

export async function recordTrainingBatch({
  ipId,
  units
}: {
  ipId: string
  units: number
}) {
  if (units <= 0) {
    throw new Error('Training units must be positive')
  }

  const convex = getConvexClient()
  const ip = (await convex.query('ipAssets:getById' as any, {
    ipId
  })) as IpRecord | null

  if (!ip) {
    throw new Error('IP asset not found')
  }

  const batchId = crypto.randomUUID()
  const payload = JSON.stringify({
    kind: 'TRAINING_BATCH',
    ipId,
    batchId,
    units,
    timestamp: Date.now()
  })
  const evidenceHash = sha256Hex(payload)
  const constellationTx = await publishEvidence(evidenceHash)

  await convex.mutation('trainingBatches:insert' as any, {
    batchId,
    ipId,
    units,
    evidenceHash,
    constellationTx
  })

  const licensesForIp = (await convex.query('licenses:listByIp' as any, {
    ipId
  })) as LicenseRecord[]

  for (const license of licensesForIp) {
    const nextTrainingUnits = license.trainingUnits + units
    const nextScore = calculateComplianceScore({
      hasPayment: Boolean(license.btcTxId),
      hasLicenseToken: Boolean(license.tokenOnChainId),
      hasConstellationEvidence: Boolean(license.constellationTx),
      hasC2paArchive: Boolean(license.c2paArchive),
      trainingUnits: nextTrainingUnits
    })

    await convex.mutation('licenses:setTrainingMetrics' as any, {
      orderId: license.orderId,
      trainingUnits: nextTrainingUnits,
      complianceScore: nextScore
    })
  }

  return {
    batchId,
    constellationTx,
    evidenceHash
  }
}
