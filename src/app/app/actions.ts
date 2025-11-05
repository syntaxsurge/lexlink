'use server'

import crypto from 'node:crypto'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { requireRole, requireSession, type SessionActor } from '@/lib/authz'
import { createLicenseArchive } from '@/lib/c2pa'
import { publishEvidence } from '@/lib/constellation'
import { getConvexClient } from '@/lib/convex'
import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'
import {
  deriveOrderSubaccount,
  formatSubaccountHex
} from '@/lib/ckbtc'
import {
  requestDepositAddress,
  confirmPayment,
  fetchAttestation,
  settleCkbtc
} from '@/lib/icp'
import {
  readPaymentMode,
  getDefaultPaymentMode,
  setPaymentModeCookie,
  type PaymentMode
} from '@/lib/payment-mode'
import {
  getStoryClient,
  getDefaultLicenseTerms,
  getDefaultLicensingConfig
} from '@/lib/story'
import { generateLicenseCredential } from '@/lib/vc'
import {
  getLedgerMetadata,
  getAccountBalance as getLedgerAccountBalance,
  requestCkbtcDepositAddress as requestMinterDepositAddress,
  updateCkbtcDepositBalance as updateMinterDepositBalance
} from '@/lib/ic/ckbtc/service'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'

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
  network?: string
  amountSats?: number
  paymentMode?: string
  ckbtcSubaccount?: string
  ckbtcMintedSats?: number
  ckbtcBlockIndex?: number
  btcTxId: string
  attestationHash: string
  constellationTx: string
  tokenOnChainId: string
  licenseTermsId: string
  status: string
  confirmations?: number
  createdAt: number
  updatedAt?: number
  fundedAt?: number
  finalizedAt?: number
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

export type AuditEventRecord = {
  eventId: string
  action: string
  resourceId?: string
  payload: Record<string, unknown>
  actorAddress?: string
  actorPrincipal?: string
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
  const candidateUrls = resolveCandidateAssetUrls(url)
  let lastError: unknown = null

  for (const candidate of candidateUrls) {
    try {
      const response = await fetch(candidate, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${candidate}: ${response.status} ${response.statusText}`
        )
      }
      const arrayBuffer = await response.arrayBuffer()
      const hash = crypto
        .createHash('sha256')
        .update(Buffer.from(arrayBuffer))
        .digest('hex')
      return `0x${hash}` as const
    } catch (error) {
      lastError = error
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : 'Unknown network failure'
  throw new Error(`Unable to download asset ${url}: ${message}`)
}

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/'
]

function resolveCandidateAssetUrls(source: string): string[] {
  const candidates = new Set<string>()
  candidates.add(source)

  try {
    const url = new URL(source)

    if (url.protocol === 'ipfs:') {
      const cidPath = url.pathname.replace(/^\/+/, '')
      for (const gateway of IPFS_GATEWAYS) {
        candidates.add(`${gateway}${cidPath}`)
      }
      return Array.from(candidates)
    }

    const pathname = url.pathname
    const ipfsIndex = pathname.indexOf('/ipfs/')
    if (ipfsIndex !== -1) {
      const cidPath = pathname.slice(ipfsIndex + '/ipfs/'.length)
      for (const gateway of IPFS_GATEWAYS) {
        candidates.add(`${gateway}${cidPath}`)
      }
    }
  } catch {
    // If URL constructor fails (plain CID), treat as IPFS hash
    const cid = source.replace(/^ipfs:\/\//, '').replace(/^\/+/, '')
    if (cid) {
      for (const gateway of IPFS_GATEWAYS) {
        candidates.add(`${gateway}${cid}`)
      }
    }
  }

  return Array.from(candidates)
}

function normalizePaymentMode(value?: string | null): PaymentMode {
  return value === 'ckbtc' ? 'ckbtc' : 'btc'
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

export type CkbtcSnapshot =
  | { enabled: false }
  | {
      enabled: true
      symbol: string
      decimals: number
      network: string
      operator: {
        principal: string
        balance: string
        formatted: string
      }
      escrow: {
        principal: string
        openBalance: string
        formattedOpenBalance: string
        openOrders: Array<{
          orderId: string
          balance: string
          formatted: string
        }>
      } | null
      warnings: string[]
    }

export async function loadCkbtcSnapshot(): Promise<CkbtcSnapshot> {
  const actor = await requireSession()

  if (!env.CKBTC_LEDGER_CANISTER_ID) {
    return { enabled: false }
  }

  const convex = getConvexClient()
  const [metadata, operatorBalanceRaw, licensesRaw] = await Promise.all([
    getLedgerMetadata(),
    getLedgerAccountBalance({ owner: actor.principal }),
    convex.query('licenses:list' as any, {})
  ])

  const escrowPrincipal =
    env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
  const openOrders =
    (licensesRaw as LicenseRecord[]).filter(
      license =>
        license.paymentMode === 'ckbtc' &&
        ['pending', 'funded', 'confirmed'].includes(license.status)
    ) ?? []

  let escrowOpenTotal = 0n
  const orderBalances: Array<{
    orderId: string
    balance: string
    formatted: string
  }> = []
  const warnings: string[] = []

  if (escrowPrincipal) {
    await Promise.all(
      openOrders.map(async order => {
        if (!order.ckbtcSubaccount) {
          warnings.push(
            `Order ${order.orderId} missing ckBTC subaccount metadata.`
          )
          return
        }
        try {
          const balance = await getLedgerAccountBalance({
            owner: escrowPrincipal,
            subaccount: hexToUint8Array(order.ckbtcSubaccount)
          })
          escrowOpenTotal += balance
          orderBalances.push({
            orderId: order.orderId,
            balance: balance.toString(),
            formatted: formatTokenAmount(balance, metadata.decimals)
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to fetch balance'
          warnings.push(`Order ${order.orderId}: ${message}`)
        }
      })
    )
  }

  return {
    enabled: true,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    network: env.CKBTC_NETWORK,
    operator: {
      principal: actor.principal,
      balance: operatorBalanceRaw.toString(),
      formatted: formatTokenAmount(operatorBalanceRaw, metadata.decimals)
    },
    escrow: escrowPrincipal
      ? {
          principal: escrowPrincipal,
          openBalance: escrowOpenTotal.toString(),
          formattedOpenBalance: formatTokenAmount(
            escrowOpenTotal,
            metadata.decimals
          ),
          openOrders: orderBalances
        }
      : null,
    warnings
  }
}

export async function allocateOperatorTopUp() {
  const actor = await requireRole(['operator', 'creator'])
  if (!env.CKBTC_MINTER_CANISTER_ID) {
    throw new Error('ckBTC minter not configured. Set CKBTC_MINTER_CANISTER_ID in the environment.')
  }

  try {
    const depositAddress = await requestMinterDepositAddress({
      owner: actor.principal
    })

    await recordEvent({
      actor,
      action: 'ckbtc.topup_address_allocated',
      payload: {
        principal: actor.principal,
        network: env.CKBTC_NETWORK,
        depositAddress
      },
      resourceId: actor.principal
    })

    return {
      depositAddress,
      principal: actor.principal,
      network: env.CKBTC_NETWORK
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to allocate deposit address'
    throw new Error(`ckBTC minter rejected the request: ${message}`)
  }
}

export async function mintOperatorTopUp() {
  const actor = await requireRole(['operator', 'creator'])

  try {
    const response = await updateMinterDepositBalance({
      owner: actor.principal
    })

    let pending = false
    let mintedAmount = 0n

    if ('Ok' in response) {
      mintedAmount = BigInt(response.Ok)
      pending = mintedAmount === 0n
    } else if ('Err' in response) {
      const err = response.Err
      if ('NoNewUtxos' in err || 'AlreadyProcessing' in err) {
        pending = true
      } else if ('TemporarilyUnavailable' in err) {
        throw new Error('ckBTC minter temporarily unavailable. Try again shortly.')
      } else if ('GenericError' in err) {
        throw new Error(
          `ckBTC minter error ${err.GenericError.error_code}: ${err.GenericError.error_message}`
        )
      } else {
        throw new Error('Unknown ckBTC minter error.')
      }
    } else {
      throw new Error('Unexpected ckBTC minter response.')
    }

    await recordEvent({
      actor,
      action: pending ? 'ckbtc.topup_pending' : 'ckbtc.topup_minted',
      payload: {
        principal: actor.principal,
        mintedSats: mintedAmount.toString(),
        pending
      },
      resourceId: actor.principal
    })

    return {
      pending,
      mintedSats: mintedAmount.toString()
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to mint ckBTC'
    throw new Error(message)
  }
}

export async function autoFinalizeCkbtcOrder(orderId: string) {
  if (!env.CKBTC_LEDGER_CANISTER_ID) {
    return { status: 'disabled' as const }
  }

  const convex = getConvexClient()
  const order = (await convex.query('licenses:get' as any, {
    orderId
  })) as LicenseRecord | null

  if (!order) {
    throw new Error('License order not found')
  }

  if (order.status === 'finalized') {
    return { status: 'finalized' as const }
  }

  if (normalizePaymentMode(order.paymentMode) !== 'ckbtc') {
    return { status: 'skipped' as const }
  }

  if (!order.ckbtcSubaccount) {
    throw new Error('Order is missing ckBTC subaccount metadata.')
  }

  const escrowPrincipal =
    env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID

  if (!escrowPrincipal) {
    throw new Error('Escrow principal not configured for ckBTC ledger settlement.')
  }

  const ledgerBalance = await getLedgerAccountBalance({
    owner: escrowPrincipal,
    subaccount: hexToUint8Array(order.ckbtcSubaccount)
  })

  const required = BigInt(order.amountSats ?? 0)
  if (ledgerBalance < required || required === 0n) {
    return { status: 'pending' as const }
  }

  await completeLicenseSale({
    orderId,
    actorOverride: {
      principal: 'system:ckbtc-finalizer',
      role: 'operator'
    }
  })

  return { status: 'finalized' as const }
}

async function recordEvent({
  actor,
  action,
  payload,
  resourceId
}: {
  actor: SessionActor
  action: string
  payload: Record<string, unknown>
  resourceId?: string
}) {
  const convex = getConvexClient()
  await convex.mutation('events:record' as any, {
    eventId: crypto.randomUUID(),
    action,
    payload: JSON.stringify(payload),
    resourceId,
    actorPrincipal: actor.principal
  })
}

export async function registerIpAsset(payload: RegisterIpPayload) {
  const actor = await requireRole(['operator', 'creator'])
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

  await recordEvent({
    actor,
    action: 'ip_asset.registered',
    payload: {
      ipId: registerResponse.ipId,
      title: payload.title,
      licenseTermsId: registerResponse.licenseTermsIds[0].toString()
    },
    resourceId: registerResponse.ipId
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
  const actor = await requireRole(['operator', 'creator'])
  const orderId = crypto.randomUUID()
  const convex = getConvexClient()

  const ipRecord = (await convex.query('ipAssets:getById' as any, {
    ipId
  })) as IpRecord | null

  if (!ipRecord) {
    throw new Error('Unable to locate IP asset in Convex')
  }

  const amountSats = ipRecord.priceSats
  const paymentMode = await readPaymentMode()
  const network =
    paymentMode === 'ckbtc' ? `ckbtc-${env.BTC_NETWORK}` : env.BTC_NETWORK
  const ckbtcSubaccount =
    paymentMode === 'ckbtc'
      ? formatSubaccountHex(deriveOrderSubaccount(orderId))
      : undefined

  let btcAddress: string
  try {
    const invoice = await requestDepositAddress(orderId, paymentMode)
    btcAddress = invoice.address
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown escrow canister error'
    const lowered = message.toLowerCase()
    if (message.includes('Requested unknown threshold key')) {
      throw new Error(
        'Escrow canister rejected the ECDSA request. Ensure your canister uses the `dfx_test_key` (local) or the appropriate subnet key via `ECDSA_KEY_NAME`.'
      )
    }
    if (message.includes('canister_not_found')) {
      throw new Error(
        'ICP escrow canister not found. Verify ICP_ESCROW_CANISTER_ID and ICP_HOST point to a deployed canister before generating invoices.'
      )
    }
    if (lowered.includes('ckbtc') && lowered.includes('not configured')) {
      throw new Error(
        'ckBTC minter missing or unavailable. Set CKBTC_MINTER_CANISTER_ID when PAYMENT_MODE=ckbtc.'
      )
    }
    throw new Error(`Failed to allocate deposit address: ${message}`)
  }

  await convex.mutation('licenses:insert' as any, {
    orderId,
    ipId,
    buyer,
    btcAddress,
    licenseTermsId,
    amountSats,
    network,
    paymentMode,
    ckbtcSubaccount
  })

  await recordEvent({
    actor,
    action: 'license.order_created',
    payload: {
      orderId,
      ipId,
      buyer,
      btcAddress,
      amountSats,
      network,
      paymentMode
    },
    resourceId: orderId
  })

  return { orderId, btcAddress, paymentMode, ckbtcSubaccount }
}

export async function simulateLicenseFunding({
  orderId
}: {
  orderId: string
}) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Simulation endpoints are disabled in production.')
  }
  const actor = await requireRole(['operator'])
  const convex = getConvexClient()

  await convex.mutation('licenses:updateFundingState' as any, {
    orderId,
    status: 'funded',
    btcTxId: `sim-${crypto.randomUUID()}`,
    confirmations: 0
  })

  await recordEvent({
    actor,
    action: 'license.simulated_funding',
    payload: {
      orderId,
      simulated: true
    },
    resourceId: orderId
  })

  return { orderId }
}

type FinalizeOrderArgs = {
  order: LicenseRecord
  ip: IpRecord
  paymentReference: string
  receiver: `0x${string}`
  actor: SessionActor
  convex: ReturnType<typeof getConvexClient>
  paymentMode: PaymentMode
  minted?: {
    sats: number
    blockIndex?: number
  }
}

async function finalizeOrder({
  order,
  ip,
  paymentReference,
  receiver,
  actor,
  convex,
  paymentMode,
  minted
}: FinalizeOrderArgs) {
  if (paymentMode === 'btc') {
    await confirmPayment(order.orderId, paymentReference)
  }
  const attestationJson = await fetchAttestation(order.orderId)
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
    orderId: order.orderId,
    ipId: order.ipId,
    licenseTokenId,
    btcTxId: paymentReference,
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
    btcTxId: paymentReference,
    constellationTx,
    attestationHash,
    contentHash,
    licenseTokenId
  })

  const vc = await generateLicenseCredential({
    subjectId: `did:pkh:eip155:${env.STORY_CHAIN_ID}:${receiver.toLowerCase()}`,
    storyLicenseId: licenseTokenId,
    btcTxId: paymentReference,
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
    trainingUnits: order.trainingUnits
  })

  await convex.mutation('licenses:markCompleted' as any, {
    orderId: order.orderId,
    btcTxId: paymentReference,
    attestationHash,
    constellationTx,
    tokenOnChainId: licenseTokenId,
    contentHash,
    c2paHash: archive.archiveHash,
    c2paArchive: archive.archiveBase64,
    vcDocument: vcJson,
    vcHash: vc.hash,
    complianceScore,
    ckbtcMintedSats: minted?.sats,
    ckbtcBlockIndex: minted?.blockIndex
  })

  await recordEvent({
    actor,
    action: 'license.sale_completed',
    payload: {
      orderId: order.orderId,
      ipId: order.ipId,
      btcTxId: paymentReference,
      constellationTx,
      licenseTokenId,
      paymentMode,
      ckbtcMintedSats: minted?.sats,
      ckbtcBlockIndex: minted?.blockIndex
    },
    resourceId: order.orderId
  })

  return {
    licenseTokenId,
    attestation,
    attestationHash,
    constellationTx,
    complianceScore,
    contentHash,
    c2paArchive: {
      base64: archive.archiveBase64,
      hash: archive.archiveHash,
      fileName: archive.suggestedFileName
    },
    vcDocument: vcJson,
    vcHash: vc.hash,
    paymentReference,
    minted
  }
}

export async function completeLicenseSale({
  orderId,
  btcTxId,
  receiver,
  actorOverride
}: {
  orderId: string
  btcTxId?: string
  receiver?: `0x${string}`
  actorOverride?: SessionActor
}) {
  if (
    actorOverride &&
    actorOverride.role !== 'operator'
  ) {
    throw new Error('Automation actor must carry operator role.')
  }
  const actor = actorOverride ?? (await requireRole(['operator']))
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

  const targetReceiver =
    receiver ?? (order.buyer as `0x${string}` | undefined)
  if (!targetReceiver) {
    throw new Error('Receiver wallet is required to mint license token.')
  }

  const paymentMode = normalizePaymentMode(order.paymentMode)
  let paymentReference = btcTxId ?? ''
  let minted:
    | {
        sats: number
        blockIndex?: number
      }
    | undefined

  if (paymentMode === 'btc') {
    if (!paymentReference) {
      throw new Error('Provide a Bitcoin transaction hash for BTC mode finalization')
    }
  } else {
    try {
      const settlement = await settleCkbtc(orderId)
      const mintedSats = Number(settlement.minted)
      const mintedBlockIndex = Number(settlement.blockIndex)
      minted = {
        sats: mintedSats,
        blockIndex: Number.isNaN(mintedBlockIndex) ? undefined : mintedBlockIndex
      }
      const fallbackBlockIndex =
        typeof minted.blockIndex === 'number' && !Number.isNaN(minted.blockIndex)
          ? minted.blockIndex
          : 0
      paymentReference =
        settlement.txids && settlement.txids.length > 0
          ? settlement.txids
          : `ckbtc-block-${fallbackBlockIndex}`
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const mintedPending =
        message.toLowerCase().includes('no ckbtc minted yet') ||
        message.toLowerCase().includes('temporarily unavailable')

      if (!mintedPending) {
        throw error
      }

      if (!env.CKBTC_LEDGER_CANISTER_ID) {
        throw new Error('ckBTC ledger is not configured; cannot verify direct ledger transfer.')
      }
      const escrowPrincipal =
        env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
      if (!escrowPrincipal) {
        throw new Error('Escrow principal not configured for ckBTC ledger settlement.')
      }
      if (!order.ckbtcSubaccount) {
        throw new Error('Order is missing ckBTC subaccount metadata.')
      }
      const subaccount = hexToUint8Array(order.ckbtcSubaccount)
      const ledgerBalance = await getLedgerAccountBalance({
        owner: escrowPrincipal,
        subaccount
      })
      const required = BigInt(order.amountSats ?? ip.priceSats ?? 0)

      if (ledgerBalance < required) {
        throw error
      }

      if (ledgerBalance > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('ckBTC balance exceeds supported range for finalization.')
      }

      const ledgerAmount = Number(ledgerBalance)
      minted = {
        sats: ledgerAmount
      }
      paymentReference = `icrc-ledger-${orderId}-${Date.now()}`
    }
  }

  const result = await finalizeOrder({
    order,
    ip,
    paymentReference,
    receiver: targetReceiver,
    actor,
    convex,
    paymentMode,
    minted
  })

  return {
    licenseTokenId: result.licenseTokenId,
    attestation: result.attestation,
    attestationHash: result.attestationHash,
    constellationTx: result.constellationTx,
    contentHash: result.contentHash,
    complianceScore: result.complianceScore,
    c2paArchive: result.c2paArchive,
    vcDocument: result.vcDocument,
    vcHash: result.vcHash,
    paymentMode,
    ckbtcMintedSats: minted?.sats,
    ckbtcBlockIndex: minted?.blockIndex
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
  const actor = await requireRole(['operator', 'creator'])
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

  await recordEvent({
    actor,
    action: 'dispute.raised',
    payload: {
      disputeId,
      ipId: payload.ipId,
      targetTag: payload.targetTag,
      evidenceCid: payload.evidenceCid,
      constellationTx,
      txHash
    },
    resourceId: disputeId
  })

  return {
    disputeId,
    txHash,
    evidenceHash,
    constellationTx
  }
}

export async function loadDashboardData() {
  await requireSession()
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
  const actor = await requireRole(['operator', 'creator'])
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

  await recordEvent({
    actor,
    action: 'training.batch_recorded',
    payload: {
      batchId,
      ipId,
      units,
      constellationTx,
      evidenceHash
    },
    resourceId: batchId
  })

  return {
    batchId,
    constellationTx,
    evidenceHash
  }
}

export type UserRecord = {
  id: string
  address?: string
  principal?: string
  role: 'operator' | 'creator' | 'viewer'
  createdAt: number
}

export async function loadUsers(): Promise<UserRecord[]> {
  await requireRole(['operator'])
  const convex = getConvexClient()
  const records = (await convex.query('users:list' as any, {})) as Array<
    Record<string, unknown>
  >

  return records.map(user => ({
    id: String(user._id),
    address: typeof user.address === 'string' ? user.address : undefined,
    principal: typeof user.principal === 'string' ? user.principal : undefined,
    role: user.role as UserRecord['role'],
    createdAt: Number(user.createdAt ?? Date.now())
  }))
}

export async function updateUserRole({
  userId,
  role
}: {
  userId: string
  role: 'operator' | 'creator' | 'viewer'
}) {
  const actor = await requireRole(['operator'])
  const convex = getConvexClient()
  await convex.mutation('users:setRole' as any, {
    userId,
    role
  })

  await recordEvent({
    actor,
    action: 'users.role_updated',
    payload: {
      userId,
      role
    },
    resourceId: userId
  })
}

export async function loadAuditTrail(limit = 50): Promise<AuditEventRecord[]> {
  await requireSession()
  const convex = getConvexClient()
  const records = (await convex.query('events:listRecent' as any, {
    limit
  })) as Array<Record<string, unknown>>

  return records.map(event => ({
    eventId: String(event.eventId ?? crypto.randomUUID()),
    action: String(event.action ?? 'unknown'),
    resourceId:
      typeof event.resourceId === 'string' ? event.resourceId : undefined,
    payload:
      typeof event.payload === 'string'
        ? (JSON.parse(event.payload) as Record<string, unknown>)
        : {},
    actorAddress:
      typeof event.actorAddress === 'string' ? event.actorAddress : undefined,
    actorPrincipal:
      typeof event.actorPrincipal === 'string'
        ? event.actorPrincipal
        : undefined,
    createdAt: Number(event.createdAt ?? Date.now())
  }))
}

export async function updatePaymentModeSetting(mode: PaymentMode) {
  const actor = await requireRole(['operator'])
  await setPaymentModeCookie(mode)

  await recordEvent({
    actor,
    action: 'settings.payment_mode_updated',
    payload: {
      mode,
      defaultMode: getDefaultPaymentMode()
    }
  })

  return {
    mode
  }
}

export async function loadInvoicePublic(orderId: string) {
  if (!orderId) return null
  const convex = getConvexClient()
  const invoice = (await convex.query('licenses:getPublic' as any, {
    orderId
  })) as
    | {
        orderId: string
        ipId: string
        ipTitle: string
        amountSats?: number
        btcAddress: string
        paymentMode?: string
        status: string
        ckbtcSubaccount?: string
        ckbtcMintedSats?: number
        ckbtcBlockIndex?: number
        createdAt: number
        updatedAt?: number
        network?: string
      }
    | null

  return invoice
}

export async function completeLicenseSaleSystem({
  orderId,
  btcTxId,
  receiver
}: {
  orderId: string
  btcTxId?: string
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

  const paymentMode = normalizePaymentMode(order.paymentMode)
  let paymentReference = btcTxId ?? ''
  let minted:
    | {
        sats: number
        blockIndex?: number
      }
    | undefined

  if (paymentMode === 'btc') {
    if (!paymentReference) {
      throw new Error('Provide a Bitcoin transaction hash for BTC mode finalization')
    }
  } else {
    const settlement = await settleCkbtc(orderId)
    const mintedSats = Number(settlement.minted)
    const blockIndexNumber = Number(settlement.blockIndex)
    minted = {
      sats: mintedSats,
      blockIndex: Number.isNaN(blockIndexNumber) ? undefined : blockIndexNumber
    }
    const fallbackBlockIndex =
      typeof minted.blockIndex === 'number' && !Number.isNaN(minted.blockIndex)
        ? minted.blockIndex
        : 0
    paymentReference =
      settlement.txids && settlement.txids.length > 0
        ? settlement.txids
        : `ckbtc-block-${fallbackBlockIndex}`
  }

  const systemActor: SessionActor = {
    principal: 'system@lexlink',
    role: 'operator'
  }

  return finalizeOrder({
    order,
    ip,
    paymentReference,
    receiver,
    actor: systemActor,
    convex,
    paymentMode,
    minted
  })
}
