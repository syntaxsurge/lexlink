'use server'

import crypto from 'node:crypto'

import { DisputeTargetTag } from '@story-protocol/core-sdk'
import { getAddress } from 'viem'

import { requireRole, requireSession, type SessionActor } from '@/lib/authz'
import { createLicenseArchive } from '@/lib/c2pa'
import { deriveOrderSubaccount, formatSubaccountHex } from '@/lib/ckbtc'
import { publishEvidence } from '@/lib/constellation'
import { getConvexClient } from '@/lib/convex'
import { env } from '@/lib/env'
import { sha256Hex } from '@/lib/hash'
import {
  getLedgerMetadata,
  getAccountBalance as getLedgerAccountBalance
} from '@/lib/ic/ckbtc/service'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'
import {
  requestDepositAddress,
  confirmPayment,
  fetchAttestation
} from '@/lib/icp'
import { generateImageFromPrompt } from '@/lib/ai'
import { uploadBytes, uploadJson, ipfsGatewayUrl } from '@/lib/ipfs'
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
  ipMetadataHash: `0x${string}`
  nftMetadataHash: `0x${string}`
  imageHash: `0x${string}`
  mediaHash: `0x${string}`
  commercialUse: boolean
  derivativesAllowed: boolean
  creators?: CreatorShare[]
  tags?: string[]
  aiMetadata?: AiMetadataRecord
  ownerPrincipal?: string
}

export type LicenseRecord = {
  orderId: string
  ipId: string
  buyer?: string
  buyerPrincipal?: string
  mintTo?: string
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
  constellationExplorerUrl?: string | null
  constellationAnchoredAt?: number | null
  constellationStatus?: string | null
  constellationError?: string | null
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
  c2paArchiveUri?: string
  c2paArchiveFileName?: string
  c2paArchiveSize?: number
  vcDocument: string
  vcHash: string
  complianceScore: number
  trainingUnits: number
  ownerPrincipal?: string
  evidencePayload?: string
}

export type DisputeRecord = {
  disputeId: string
  ipId: string
  targetTag: DisputeTargetTag | string
  evidenceCid: string
  txHash: string
  evidenceHash: string
  constellationTx: string
  constellationExplorerUrl?: string | null
  status: string
  livenessSeconds: number
  bond: number
  createdAt: number
  ownerPrincipal?: string
}

export type TrainingBatchRecord = {
  batchId: string
  ipId: string
  units: number
  evidenceHash: string
  constellationTx: string
  constellationExplorerUrl?: string | null
  createdAt: number
  ownerPrincipal?: string
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

export type ProfileRecord = {
  principal: string
  defaultMintTo?: string
  createdAt: number
  updatedAt: number
}

type CreatorSocialInput = {
  platform: string
  url: string
}

export type CreatorSocialLink = {
  platform: string
  url: string
}

export type CreatorShare = {
  name: string
  address: string
  contributionPercent: number
  role?: string
  description?: string
  socialMedia?: CreatorSocialLink[]
}

export type AiMetadataRecord = {
  prompt: string
  model: string
  provider?: string
  enhancedPrompt?: string
  generatedAt: number
  contentHash?: string
}

type AiMetadataInput = {
  prompt: string
  model: string
  provider?: string
  enhancedPrompt?: string
  generatedAt?: number | string
  contentHash?: string
}

type CreatorInput = {
  name: string
  address: string
  role?: string
  description?: string
  contributionPercent: number
  socialMedia?: CreatorSocialInput[]
}

type SerializedFile = {
  name: string
  type: string
  size: number
  data: string
}

type AssetInput =
  | { kind: 'file'; file: SerializedFile }
  | { kind: 'url'; url: string }

type NftAttributeInput = {
  traitType: string
  value: string
}

export type RegisterIpPayload = {
  title: string
  description: string
  createdAt: string
  image: AssetInput
  media: AssetInput
  mediaType: string
  creators?: CreatorInput[]
  tags?: string[]
  aiMetadata?: AiMetadataInput
  priceSats: number
  royaltyBps: number
  commercialUse: boolean
  derivativesAllowed: boolean
  nftAttributes?: NftAttributeInput[]
  relationships?: RelationshipInput[]
  customMetadata?: Record<string, unknown>
}

export type GenerateAiIpPayload = {
  prompt: string
  title: string
  description: string
  tags?: string[]
  priceBtc: number
  royaltyPercent: number
  commercialUse: boolean
  derivativesAllowed: boolean
  enhancePrompt?: boolean
}

type RelationshipInput = {
  parentIpId: string
  type: string
}

type ConvexClient = ReturnType<typeof getConvexClient>

async function fetchOwnerPrincipalFromEvent({
  convex,
  resourceId,
  action
}: {
  convex: ConvexClient
  resourceId: string
  action: string
}): Promise<string | undefined> {
  const events = (await convex.query('events:listByResource' as any, {
    resourceId
  })) as Array<Record<string, unknown>>

  for (const event of events) {
    const eventAction = String(event.action ?? '')
    const actorPrincipal =
      typeof event.actorPrincipal === 'string'
        ? (event.actorPrincipal as string)
        : undefined
    if (eventAction === action && actorPrincipal) {
      return actorPrincipal
    }
  }

  return undefined
}

async function ensureIpOwner(
  ip: IpRecord,
  convex: ConvexClient
): Promise<string | undefined> {
  if (ip.ownerPrincipal) {
    return ip.ownerPrincipal
  }

  const owner = await fetchOwnerPrincipalFromEvent({
    convex,
    resourceId: ip.ipId,
    action: 'ip_asset.registered'
  })

  if (owner) {
    await convex.mutation('ipAssets:assignOwner' as any, {
      ipId: ip.ipId,
      ownerPrincipal: owner
    })
    ip.ownerPrincipal = owner
  }

  return owner
}

async function ensureLicenseOwner({
  license,
  convex,
  ipOwners
}: {
  license: LicenseRecord
  convex: ConvexClient
  ipOwners: Map<string, string>
}): Promise<string | undefined> {
  if (license.ownerPrincipal) {
    return license.ownerPrincipal
  }

  const ipOwner = ipOwners.get(license.ipId)
  if (ipOwner) {
    await convex.mutation('licenses:assignOwner' as any, {
      orderId: license.orderId,
      ownerPrincipal: ipOwner
    })
    license.ownerPrincipal = ipOwner
    return ipOwner
  }

  const owner = await fetchOwnerPrincipalFromEvent({
    convex,
    resourceId: license.orderId,
    action: 'license.order_created'
  })

  if (owner) {
    await convex.mutation('licenses:assignOwner' as any, {
      orderId: license.orderId,
      ownerPrincipal: owner
    })
    license.ownerPrincipal = owner
    if (!ipOwners.has(license.ipId)) {
      ipOwners.set(license.ipId, owner)
    }
  }

  return owner
}

async function ensureDisputeOwner({
  dispute,
  convex,
  ipOwners
}: {
  dispute: DisputeRecord
  convex: ConvexClient
  ipOwners: Map<string, string>
}): Promise<string | undefined> {
  if (dispute.ownerPrincipal) {
    return dispute.ownerPrincipal
  }

  const ipOwner = ipOwners.get(dispute.ipId)
  if (ipOwner) {
    await convex.mutation('disputes:assignOwner' as any, {
      disputeId: dispute.disputeId,
      ownerPrincipal: ipOwner
    })
    dispute.ownerPrincipal = ipOwner
    return ipOwner
  }

  const owner = await fetchOwnerPrincipalFromEvent({
    convex,
    resourceId: dispute.disputeId,
    action: 'dispute.raised'
  })

  if (owner) {
    await convex.mutation('disputes:assignOwner' as any, {
      disputeId: dispute.disputeId,
      ownerPrincipal: owner
    })
    dispute.ownerPrincipal = owner
    if (!ipOwners.has(dispute.ipId)) {
      ipOwners.set(dispute.ipId, owner)
    }
  }

  return owner
}

async function ensureTrainingOwner({
  batch,
  convex,
  ipOwners
}: {
  batch: TrainingBatchRecord
  convex: ConvexClient
  ipOwners: Map<string, string>
}): Promise<string | undefined> {
  if (batch.ownerPrincipal) {
    return batch.ownerPrincipal
  }

  const ipOwner = ipOwners.get(batch.ipId)
  if (ipOwner) {
    await convex.mutation('trainingBatches:assignOwner' as any, {
      batchId: batch.batchId,
      ownerPrincipal: ipOwner
    })
    batch.ownerPrincipal = ipOwner
    return ipOwner
  }

  const owner = await fetchOwnerPrincipalFromEvent({
    convex,
    resourceId: batch.batchId,
    action: 'training.batch_recorded'
  })

  if (owner) {
    await convex.mutation('trainingBatches:assignOwner' as any, {
      batchId: batch.batchId,
      ownerPrincipal: owner
    })
    batch.ownerPrincipal = owner
    if (!ipOwners.has(batch.ipId)) {
      ipOwners.set(batch.ipId, owner)
    }
  }

  return owner
}

async function assertActorOwnsIp({
  ip,
  actor,
  convex
}: {
  ip: IpRecord
  actor: SessionActor
  convex: ConvexClient
}) {
  const resolvedOwner = await ensureIpOwner(ip, convex)

  if (resolvedOwner && resolvedOwner !== actor.principal) {
    throw new Error('You do not have access to this IP asset.')
  }

  if (!resolvedOwner) {
    await convex.mutation('ipAssets:assignOwner' as any, {
      ipId: ip.ipId,
      ownerPrincipal: actor.principal
    })
    ip.ownerPrincipal = actor.principal
  }
}

async function assertActorOwnsLicense({
  license,
  ip,
  actor,
  convex
}: {
  license: LicenseRecord
  ip: IpRecord
  actor: SessionActor
  convex: ConvexClient
}) {
  await assertActorOwnsIp({ ip, actor, convex })

  const ipOwners = new Map<string, string>()
  if (ip.ownerPrincipal) {
    ipOwners.set(ip.ipId, ip.ownerPrincipal)
  }

  const resolvedOwner = await ensureLicenseOwner({
    license,
    convex,
    ipOwners
  })

  if (resolvedOwner && resolvedOwner !== actor.principal) {
    throw new Error('You do not have access to this license order.')
  }

  if (!resolvedOwner) {
    await convex.mutation('licenses:assignOwner' as any, {
      orderId: license.orderId,
      ownerPrincipal: actor.principal
    })
    license.ownerPrincipal = actor.principal
  }
}

function isSystemActor(actor: SessionActor | undefined) {
  return actor?.principal.startsWith('system:')
}

function sanitizeCreators(creators?: CreatorInput[]) {
  if (!creators) {
    return []
  }
  return creators
    .map(creator => ({
      name: creator.name.trim(),
      address: creator.address.trim(),
      role: creator.role?.trim() || undefined,
      description: creator.description?.trim() || undefined,
      contributionPercent: creator.contributionPercent,
      socialMedia: sanitizeCreatorSocialLinks(creator.socialMedia)
    }))
    .filter(
      creator =>
        creator.name.length > 0 && creator.address.length > 0
    )
}

function sanitizeCreatorSocialLinks(
  links?: CreatorSocialInput[]
): CreatorSocialLink[] | undefined {
  if (!links) {
    return undefined
  }
  const normalized = links
    .map(link => {
      const platform = link.platform?.trim() ?? ''
      const normalizedUrl = normalizeCreatorUrl(link.url)
      if (!platform || !normalizedUrl) {
        return null
      }
      return {
        platform,
        url: normalizedUrl
      }
    })
    .filter((value): value is CreatorSocialLink => value !== null)

  return normalized.length > 0 ? normalized : undefined
}

function normalizeCreatorUrl(url?: string) {
  const value = url?.trim()
  if (!value) {
    return null
  }
  const candidates = [value, `https://${value}`]
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate)
      return parsed.toString()
    } catch {
      continue
    }
  }
  return null
}

function sanitizeRelationships(relationships?: RelationshipInput[]) {
  if (!relationships) {
    return []
  }
  return relationships
    .map(relationship => ({
      parentIpId: relationship.parentIpId.trim(),
      type: relationship.type.trim().toUpperCase()
    }))
    .filter(
      relationship =>
        /^0x[a-fA-F0-9]{40}$/.test(relationship.parentIpId) &&
        relationship.type.length > 0
    )
}

function ensurePercent(creators: CreatorInput[]) {
  if (creators.length === 0) {
    return
  }
  if (
    creators.some(
      creator =>
        typeof creator.contributionPercent !== 'number' ||
        Number.isNaN(creator.contributionPercent)
    )
  ) {
    throw new Error('Each creator requires a contributionPercent value')
  }
  const total = creators.reduce(
    (sum, creator) => sum + creator.contributionPercent,
    0
  )
  if (Math.abs(total - 100) > 0.001) {
    throw new Error('Creator contributionPercent values must total 100')
  }
}

function sanitizeTags(tags?: string[]) {
  if (!tags) {
    return undefined
  }
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const raw of tags) {
    const tag = raw?.trim()
    if (!tag) {
      continue
    }
    const key = tag.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(tag)
    }
  }
  return deduped.length > 0 ? deduped : undefined
}

function normalizeAiMetadata(
  metadata?: AiMetadataInput
): AiMetadataRecord | undefined {
  if (!metadata) {
    return undefined
  }
  const prompt = metadata.prompt?.trim() ?? ''
  const model = metadata.model?.trim() ?? ''
  if (!prompt || !model) {
    return undefined
  }

  let generatedAt = Date.now()
  if (metadata.generatedAt !== undefined) {
    const value = metadata.generatedAt
    if (typeof value === 'string') {
      const parsed = Date.parse(value)
      generatedAt = Number.isFinite(parsed) ? parsed : Date.now()
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      generatedAt = value
    }
  }

  return {
    prompt,
    model,
    provider: metadata.provider?.trim() || undefined,
    enhancedPrompt: metadata.enhancedPrompt?.trim() || undefined,
    generatedAt,
    contentHash: normalizeContentHash(metadata.contentHash)
  }
}

function normalizeContentHash(hash?: string) {
  if (!hash) {
    return undefined
  }
  const trimmed = hash.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
}

function normalizeCustomMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined
  }
  if (Array.isArray(metadata)) {
    return undefined
  }
  const entries = Object.entries(metadata)
  if (entries.length === 0) {
    return undefined
  }
  const reservedKeys = new Set([
    'title',
    'description',
    'createdAt',
    'image',
    'imageHash',
    'creators',
    'mediaUrl',
    'mediaHash',
    'mediaType',
    'relationships',
    'license'
  ])
  return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (reservedKeys.has(key)) {
      return acc
    }
    acc[key] = value
    return acc
  }, {})
}

async function assertDerivativeCompatibility({
  convex,
  storyClient,
  relationships,
  newLicense
}: {
  convex: ConvexClient
  storyClient: ReturnType<typeof getStoryClient>
  relationships: Array<{ parentIpId: string; type: string }>
  newLicense: {
    commercialUse: boolean
    derivativesAllowed: boolean
    royaltyBps: number
  }
}) {
  if (!relationships.length) {
    return
  }

  for (const relationship of relationships) {
    const parentIp = (await convex.query('ipAssets:getById' as any, {
      ipId: relationship.parentIpId
    })) as IpRecord | null

    if (!parentIp) {
      throw new Error(
        `Relationship references unknown parent IP ${relationship.parentIpId}`
      )
    }

    const parentTermsResponse = await storyClient.license.getLicenseTerms(
      BigInt(parentIp.licenseTermsId)
    )
    const parentTerms = parentTermsResponse.terms
    const parentLabel = parentIp.title || parentIp.ipId

    if (!parentTerms.derivativesAllowed) {
      throw new Error(
        `${parentLabel} forbids derivatives. Remove the relationship or adjust the license terms.`
      )
    }

    if (!parentTerms.commercialUse && newLicense.commercialUse) {
      throw new Error(
        `${parentLabel} is registered for non-commercial use. Derivative licenses must remain non-commercial.`
      )
    }

    if (
      parentTerms.derivativesReciprocal &&
      (!newLicense.derivativesAllowed ||
        newLicense.royaltyBps < parentIp.royaltyBps)
    ) {
      throw new Error(
        `${parentLabel} enforces reciprocal derivatives. Keep derivatives allowed and royalties at least ${(
          parentIp.royaltyBps / 100
        ).toFixed(2)}%.`
      )
    }

    if (newLicense.royaltyBps < parentIp.royaltyBps) {
      throw new Error(
        `Derivative royalty share must be ≥ parent share (${(
          parentIp.royaltyBps / 100
        ).toFixed(2)}%) for ${parentLabel}.`
      )
    }
  }
}

type ResolvedAsset = {
  bytes: Uint8Array
  mimeType?: string
  name: string
}

async function prepareAsset({
  input,
  fallbackName,
  explicitMimeType
}: {
  input: AssetInput
  fallbackName: string
  explicitMimeType?: string
}) {
  const resolved =
    input.kind === 'file'
      ? await resolveFileAsset(input.file, fallbackName)
      : await resolveUrlAsset(input.url, fallbackName)

  const mimeType =
    explicitMimeType ?? resolved.mimeType ?? 'application/octet-stream'
  const fileName = ensureExtension(resolved.name || fallbackName, mimeType)
  const uri = await uploadBytes(fileName, resolved.bytes)
  const hash = sha256Hex(Buffer.from(resolved.bytes))

  return {
    uri,
    hash,
    mimeType
  }
}

function resolveFileAsset(
  file: SerializedFile,
  fallbackName: string
): ResolvedAsset {
  const base64 = stripDataUrlPrefix(file.data)
  const buffer = Buffer.from(base64, 'base64')
  return {
    bytes: new Uint8Array(buffer),
    mimeType: file.type || undefined,
    name: file.name || fallbackName
  }
}

async function resolveUrlAsset(
  url: string,
  fallbackName: string
): Promise<ResolvedAsset> {
  const downloaded = await downloadAssetFromUrl(url)
  return {
    bytes: downloaded.bytes,
    mimeType: downloaded.mimeType,
    name: downloaded.fileName ?? fallbackName
  }
}

async function downloadAssetFromUrl(url: string) {
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
      const bytes = new Uint8Array(arrayBuffer)
      const contentType = response.headers.get('content-type') ?? undefined
      const finalUrl = response.url || candidate
      return {
        bytes,
        mimeType: normalizeMimeType(contentType),
        fileName: extractFileName(finalUrl)
      }
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
    const cid = source.replace(/^ipfs:\/\//, '').replace(/^\/+/, '')
    if (cid) {
      for (const gateway of IPFS_GATEWAYS) {
        candidates.add(`${gateway}${cid}`)
      }
    }
  }

  return Array.from(candidates)
}

function extractFileName(url: string) {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return undefined
    }
    const raw = segments[segments.length - 1]
    if (!raw) {
      return undefined
    }
    return decodeURIComponent(raw)
  } catch {
    return undefined
  }
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/flac': '.flac',
  'audio/ogg': '.ogg',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov'
}

function ensureExtension(name: string, mimeType?: string) {
  const sanitized = sanitizeFileName(name)
  if (/\.[A-Za-z0-9]+$/.test(sanitized)) {
    return sanitized
  }
  const extension = mimeType
    ? (MIME_EXTENSION_MAP[mimeType.toLowerCase()] ?? '.bin')
    : '.bin'
  return `${sanitized}${extension}`
}

function sanitizeFileName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, '-')
  const cleaned = trimmed
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return (cleaned || 'asset').slice(0, 64)
}

function normalizeMimeType(contentType?: string) {
  if (!contentType) {
    return undefined
  }
  return contentType.split(';')[0]?.trim() || undefined
}

function stripDataUrlPrefix(data: string) {
  if (data.startsWith('data:')) {
    const commaIndex = data.indexOf(',')
    if (commaIndex !== -1) {
      return data.slice(commaIndex + 1).replace(/\s/g, '')
    }
  }
  return data.replace(/\s/g, '')
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset'
  ).slice(0, 48)
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
  | { enabled: false; error?: string }
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
    return {
      enabled: false,
      error:
        'ckBTC ledger canister ID is not configured. Set CKBTC_LEDGER_CANISTER_ID or ICP_CKBTC_LEDGER_CANISTER_ID.'
    }
  }

  if (
    env.CKBTC_HOST.includes('127.0.0.1') ||
    env.CKBTC_HOST.includes('localhost')
  ) {
    return {
      enabled: false,
      error:
        'ckBTC balance lookup requires an ICP boundary node. Set ICP_CKBTC_HOST / NEXT_PUBLIC_ICP_CKBTC_HOST to https://icp-api.io (or another gateway).'
    }
  }

  try {
    const convex = getConvexClient()
    const [metadata, operatorBalanceRaw, licensesRaw, ipsRaw] =
      await Promise.all([
        getLedgerMetadata(),
        getLedgerAccountBalance({ owner: actor.principal }),
        convex.query('licenses:list' as any, {}),
        convex.query('ipAssets:list' as any, {})
      ])

    const ipOwners = new Map<string, string>()
    for (const ip of ipsRaw as IpRecord[]) {
      const owner = await ensureIpOwner(ip, convex)
      if (owner) {
        ipOwners.set(ip.ipId, owner)
      }
    }

    const scopedLicenses = [] as LicenseRecord[]
    for (const license of licensesRaw as LicenseRecord[]) {
      const owner = await ensureLicenseOwner({
        license,
        convex,
        ipOwners
      })
      if (owner === actor.principal) {
        scopedLicenses.push({
          ...license,
          ownerPrincipal: owner
        })
      }
    }

    const escrowPrincipal =
      env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
    const openOrders =
      scopedLicenses.filter(
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reach ckBTC ledger. Verify ICP_HOST and canister IDs.'
    return {
      enabled: false,
      error: message
    }
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

  if (order.status === 'finalizing') {
    return { status: 'pending' as const }
  }

  if (normalizePaymentMode(order.paymentMode) !== 'ckbtc') {
    return { status: 'skipped' as const }
  }

  if (!order.ckbtcSubaccount) {
    throw new Error('Order is missing ckBTC subaccount metadata.')
  }

  if (!order.mintTo && !order.buyer) {
    return { status: 'pending' as const }
  }

  const escrowPrincipal =
    env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID

  if (!escrowPrincipal) {
    throw new Error(
      'Escrow principal not configured for ckBTC ledger settlement.'
    )
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
  const creators = sanitizeCreators(payload.creators)
  const relationships = sanitizeRelationships(payload.relationships)
  const tags = sanitizeTags(payload.tags)
  const aiMetadata = normalizeAiMetadata(payload.aiMetadata)
  ensurePercent(creators)
  const convex = getConvexClient()
  const storyClient = getStoryClient()

  const ddexParticipants = creators.map(creator => ({
    name: creator.name,
    role: creator.role ?? 'Contributor',
    contributionPercent: creator.contributionPercent,
    address: creator.address
  }))

  const createdAtIso = new Date(payload.createdAt).toISOString()
  const assetSlug = slugify(payload.title)
  const mediaType = payload.mediaType || 'application/octet-stream'
  const customMetadata = normalizeCustomMetadata(payload.customMetadata)

  const [imageAsset, mediaAsset] = await Promise.all([
    prepareAsset({
      input: payload.image,
      fallbackName: `${assetSlug}-image`,
      explicitMimeType: undefined
    }),
    prepareAsset({
      input: payload.media,
      fallbackName: `${assetSlug}-media`,
      explicitMimeType: mediaType
    })
  ])

  const creatorMetadata = creators.map(creator => {
    const metadata: Record<string, unknown> = {
      name: creator.name,
      address: creator.address,
      contributionPercent: creator.contributionPercent
    }
    if (creator.role) {
      metadata.role = creator.role
    }
    if (creator.description) {
      metadata.description = creator.description
    }
    if (creator.socialMedia && creator.socialMedia.length > 0) {
      metadata.socialMedia = creator.socialMedia
    }
    return metadata
  })

  const ipMetadataPayload: Record<string, unknown> = {
    title: payload.title,
    description: payload.description,
    createdAt: createdAtIso,
    image: imageAsset.uri,
    imageHash: imageAsset.hash,
    mediaUrl: mediaAsset.uri,
    mediaHash: mediaAsset.hash,
    mediaType,
    creators: creatorMetadata,
    ddex: {
      workTitle: payload.title,
      resourceType: mediaType,
      participants: ddexParticipants,
      rights: {
        commercialUse: payload.commercialUse,
        derivativesAllowed: payload.derivativesAllowed,
        royaltyBps: payload.royaltyBps
      }
    },
    license: {
      commercialUse: payload.commercialUse,
      derivativesAllowed: payload.derivativesAllowed,
      royaltyPercent: Math.min(payload.royaltyBps / 100, 100)
    }
  }

  if (tags) {
    ipMetadataPayload.tags = tags
  }

  if (aiMetadata) {
    ipMetadataPayload.aiMetadata = {
      prompt: aiMetadata.prompt,
      model: aiMetadata.model,
      generatedAt: aiMetadata.generatedAt,
      ...(aiMetadata.provider ? { provider: aiMetadata.provider } : {}),
      ...(aiMetadata.enhancedPrompt
        ? { enhancedPrompt: aiMetadata.enhancedPrompt }
        : {}),
      ...(aiMetadata.contentHash ? { contentHash: aiMetadata.contentHash } : {})
    }
  }

  if (relationships.length > 0) {
    ipMetadataPayload.relationships = relationships
  }

  if (customMetadata) {
    Object.assign(ipMetadataPayload, customMetadata)
  }

  const nftMetadataPayload = {
    name: payload.title,
    description: payload.description,
    image: imageAsset.uri,
    animation_url: mediaAsset.uri,
    attributes: (payload.nftAttributes ?? []).map(attribute => ({
      trait_type: attribute.traitType,
      value: attribute.value
    }))
  }

  const [ipMetadataUpload, nftMetadataUpload] = await Promise.all([
    uploadJson(`${assetSlug}-ip.json`, ipMetadataPayload),
    uploadJson(`${assetSlug}-nft.json`, nftMetadataPayload)
  ])

  const ipMetadataUri = ipMetadataUpload.uri
  const nftMetadataUri = nftMetadataUpload.uri
  const ipMetadataHash = sha256Hex(Buffer.from(ipMetadataUpload.bytes))
  const nftMetadataHash = sha256Hex(Buffer.from(nftMetadataUpload.bytes))

  const royaltyPercent = Math.min(payload.royaltyBps / 100, 100)

  const licenseTerms = getDefaultLicenseTerms({
    commercialRevSharePercent: royaltyPercent,
    commercialUse: payload.commercialUse,
    derivativesAllowed: payload.derivativesAllowed
  })
  const licensingConfig = getDefaultLicensingConfig({
    commercialRevSharePercent: royaltyPercent
  })

  await assertDerivativeCompatibility({
    convex,
    storyClient,
    relationships,
    newLicense: {
      commercialUse: payload.commercialUse,
      derivativesAllowed: payload.derivativesAllowed,
      royaltyBps: payload.royaltyBps
    }
  })

  const registerResponse =
    await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: env.STORY_SPG_NFT_ADDRESS as `0x${string}`,
      allowDuplicates: false,
      ipMetadata: {
        ipMetadataURI: ipMetadataUri,
        ipMetadataHash,
        nftMetadataURI: nftMetadataUri,
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

  await convex.mutation('ipAssets:insert' as any, {
    ipId: registerResponse.ipId,
    title: payload.title,
    creatorAddress: creators[0]?.address ?? env.STORY_SPG_NFT_ADDRESS,
    priceSats: payload.priceSats,
    royaltyBps: payload.royaltyBps,
    licenseTermsId: registerResponse.licenseTermsIds[0].toString(),
    description: payload.description,
    imageUrl: imageAsset.uri,
    imageHash: imageAsset.hash,
    mediaUrl: mediaAsset.uri,
    mediaHash: mediaAsset.hash,
    mediaType,
    creators: creators.length > 0 ? creators : undefined,
    tags,
    aiMetadata: aiMetadata
      ? {
          ...aiMetadata,
          generatedAt: Math.trunc(aiMetadata.generatedAt)
        }
      : undefined,
    ipMetadataUri,
    ipMetadataHash,
    nftMetadataUri,
    nftMetadataHash,
    commercialUse: payload.commercialUse,
    derivativesAllowed: payload.derivativesAllowed,
    ownerPrincipal: actor.principal
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
      uri: ipMetadataUri
    },
    nftMetadata: {
      hash: nftMetadataHash,
      uri: nftMetadataUri
    },
    assets: {
      imageUri: imageAsset.uri,
      imageHash: imageAsset.hash,
      mediaUri: mediaAsset.uri,
      mediaHash: mediaAsset.hash
    },
    creators,
    tags,
    aiMetadata
  }
}

export async function generateAiIpAsset(payload: GenerateAiIpPayload) {
  const actor = await requireRole(['operator', 'creator'])
  const prompt = payload.prompt.trim()
  if (prompt.length < 10) {
    throw new Error('Provide a descriptive prompt (at least 10 characters)')
  }
  const title = payload.title.trim()
  if (title.length < 3) {
    throw new Error('Title must be at least 3 characters')
  }
  const description = payload.description.trim()
  if (description.length < 20) {
    throw new Error('Description must be at least 20 characters')
  }

  const priceSats = Math.round(payload.priceBtc * 100_000_000)
  if (!Number.isFinite(priceSats) || priceSats <= 0) {
    throw new Error('Price must be greater than zero')
  }

  const royaltyBps = Math.round(payload.royaltyPercent * 100)
  if (!Number.isFinite(royaltyBps) || royaltyBps < 0 || royaltyBps > 10000) {
    throw new Error('Royalties must be between 0% and 100%')
  }

  const generation = await generateImageFromPrompt({
    prompt,
    enhancePrompt: payload.enhancePrompt ?? true
  })

  const fileNameBase = `${slugify(title)}-ai`
  const fileName = ensureExtension(fileNameBase, generation.mimeType)
  const base64 = Buffer.from(generation.bytes).toString('base64')
  const serialized: SerializedFile = {
    name: fileName,
    type: generation.mimeType,
    size: generation.bytes.length,
    data: `data:${generation.mimeType};base64,${base64}`
  }

  const creatorSocial =
    env.AI_CREATOR_SOCIAL_URL !== undefined
      ? [
          {
            platform: env.AI_CREATOR_SOCIAL_PLATFORM,
            url: env.AI_CREATOR_SOCIAL_URL
          }
        ]
      : undefined

  const creators: CreatorInput[] = [
    {
      name: env.AI_CREATOR_NAME,
      address: env.AI_CREATOR_ADDRESS,
      role: 'AI Generator',
      description: env.AI_CREATOR_DESCRIPTION,
      contributionPercent: 100,
      socialMedia: creatorSocial
    }
  ]

  const tags = sanitizeTags(payload.tags)

  const aiMetadata: AiMetadataInput = {
    prompt,
    model: generation.model,
    provider: generation.provider,
    enhancedPrompt: generation.enhancedPrompt,
    generatedAt: Date.now(),
    contentHash: generation.contentHash
  }

  const registration = await registerIpAsset({
    title,
    description,
    createdAt: new Date().toISOString(),
    image: { kind: 'file', file: serialized },
    media: { kind: 'file', file: serialized },
    mediaType: generation.mimeType,
    creators,
    tags,
    aiMetadata,
    priceSats,
    royaltyBps,
    commercialUse: payload.commercialUse,
    derivativesAllowed: payload.derivativesAllowed
  })

  await recordEvent({
    actor,
    action: 'ip_asset.generated',
    payload: {
      ipId: registration.ipId,
      model: generation.model,
      provider: generation.provider,
      contentHash: generation.contentHash
    },
    resourceId: registration.ipId
  })

  return {
    ...registration,
    contentHash: generation.contentHash,
    enhancedPrompt: generation.enhancedPrompt ?? prompt,
    model: generation.model,
    provider: generation.provider
  }
}

export async function loadPublicCatalog() {
  const convex = getConvexClient()
  const raw = (await convex.query('ipAssets:list' as any, {})) as Array<
    IpRecord & { _id: string; _creationTime: number }
  >

  return raw
    .map(record => {
      const { _id, _creationTime, ...rest } = record as IpRecord & {
        _id: string
        _creationTime: number
      }
      return {
        ...rest,
        createdAt: rest.createdAt ?? _creationTime
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function createLicenseOrder({
  ipId,
  licenseTermsId
}: {
  ipId: string
  licenseTermsId: string
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

  await assertActorOwnsIp({ ip: ipRecord, actor, convex })

  const amountSats = ipRecord.priceSats
  const paymentMode = await readPaymentMode()
  const network =
    paymentMode === 'ckbtc' ? `ckbtc-${env.BTC_NETWORK}` : env.BTC_NETWORK
  const ckbtcSubaccount =
    paymentMode === 'ckbtc'
      ? formatSubaccountHex(deriveOrderSubaccount(orderId))
      : undefined

  let btcAddress: string
  let ckbtcEscrowPrincipal: string | undefined

  if (paymentMode === 'ckbtc') {
    ckbtcEscrowPrincipal =
      env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
    if (!ckbtcEscrowPrincipal) {
      throw new Error(
        'Escrow principal not configured for ckBTC settlement. Set CKBTC_MERCHANT_PRINCIPAL or ICP_ESCROW_CANISTER_ID.'
      )
    }
    const labelParts = [
      `owner=${ckbtcEscrowPrincipal}`,
      ckbtcSubaccount ? `subaccount=${ckbtcSubaccount}` : null
    ].filter(Boolean)
    btcAddress = `icrc://${labelParts.join(';')}`
  } else {
    try {
      const invoice = await requestDepositAddress(orderId, paymentMode)
      btcAddress = invoice.address
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown escrow canister error'
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
      throw new Error(`Failed to allocate deposit address: ${message}`)
    }
  }

  await convex.mutation('licenses:insert' as any, {
    orderId,
    ipId,
    btcAddress,
    licenseTermsId,
    amountSats,
    network,
    paymentMode,
    ckbtcSubaccount,
    ownerPrincipal: actor.principal
  })

  await recordEvent({
    actor,
    action: 'license.order_created',
    payload: {
      orderId,
      ipId,
      btcAddress,
      amountSats,
      network,
      paymentMode
    },
    resourceId: orderId
  })

  return {
    orderId,
    btcAddress,
    paymentMode,
    ckbtcSubaccount,
    ckbtcEscrowPrincipal
  }
}

export async function setOrderMintTarget({
  orderId,
  mintTo,
  rememberPreference = true
}: {
  orderId: string
  mintTo: string
  rememberPreference?: boolean
}) {
  const actor = await requireSession()
  if (!mintTo) {
    throw new Error('Mint target address is required')
  }

  let normalizedMintTo: `0x${string}`
  try {
    normalizedMintTo = getAddress(mintTo)
  } catch {
    throw new Error('Mint target must be a valid EVM address')
  }

  const convex = getConvexClient()

  await convex.mutation('licenses:attachBuyer' as any, {
    orderId,
    buyerPrincipal: actor.principal,
    mintTo: normalizedMintTo
  })

  if (rememberPreference) {
    await convex.mutation('profiles:upsert' as any, {
      principal: actor.principal,
      defaultMintTo: normalizedMintTo
    })
  }

  await recordEvent({
    actor,
    action: 'license.buyer_attached',
    payload: {
      orderId,
      mintTo: normalizedMintTo,
      remembered: rememberPreference
    },
    resourceId: orderId
  })

  return {
    orderId,
    mintTo: normalizedMintTo
  }
}

export async function simulateLicenseFunding({ orderId }: { orderId: string }) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Simulation endpoints are disabled in production.')
  }
  const actor = await requireRole(['operator'])
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

  await assertActorOwnsLicense({ license: order, ip, actor, convex })

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
  const lock = await convex.mutation('licenses:requestFinalization' as any, {
    orderId: order.orderId
  })

  if (!lock?.proceed) {
    const status = (lock as { status?: string })?.status
    const note =
      status === 'finalized'
        ? 'License order already finalized.'
        : 'License finalization already running.'
    throw new Error(note)
  }

  try {
    const attestationJson = await fetchAttestation(order.orderId)
    const attestation = JSON.parse(attestationJson)
    const attestationHash = sha256Hex(attestationJson)

    const storyClient = getStoryClient()

    // Retry logic for nonce errors (max 3 attempts with exponential backoff)
    let mintResponse: Awaited<ReturnType<typeof storyClient.license.mintLicenseTokens>> | null = null
    let lastError: Error | null = null
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Story] Minting license token (attempt ${attempt}/${maxRetries})...`)
        mintResponse = await storyClient.license.mintLicenseTokens({
          licensorIpId: order.ipId as `0x${string}`,
          licenseTermsId: BigInt(order.licenseTermsId),
          licenseTemplate: env.STORY_LICENSE_TEMPLATE_ADDRESS as `0x${string}`,
          amount: 1,
          receiver,
          maxMintingFee: 0,
          maxRevenueShare: 100
        })
        console.log(`[Story] ✅ License token minted successfully on attempt ${attempt}`)
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const errorMessage = lastError.message.toLowerCase()
        const isNonceError =
          errorMessage.includes('nonce') &&
          (errorMessage.includes('lower') || errorMessage.includes('already known'))

        if (isNonceError && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000
          console.warn(
            `[Story] ⚠️ Nonce error on attempt ${attempt}, retrying in ${waitTime}ms...`
          )
          console.warn(`[Story] Error: ${errorMessage.slice(0, 200)}`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        console.error(
          `[Story] ❌ Failed to mint license token on attempt ${attempt}`
        )
        console.error(`[Story] Error: ${errorMessage}`)
        throw new Error(`Failed to mint license tokens: ${errorMessage}`)
      }
    }

    if (!mintResponse?.licenseTokenIds?.length) {
      throw new Error('Failed to mint license token on Story Protocol - no token IDs returned')
    }

    const licenseTokenId = mintResponse.licenseTokenIds[0].toString()

    const mediaUrl = ipfsGatewayUrl(ip.mediaUrl)
    const mediaResponse = await fetch(mediaUrl, { cache: 'no-store' })
    if (!mediaResponse.ok) {
      throw new Error(
        `Failed to fetch media for IP: ${mediaResponse.status} ${mediaResponse.statusText}`
      )
    }
    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer())
    const contentHash = sha256Hex(mediaBuffer)

    const evidencePayload = {
      kind: 'LICENSE_COMPLETED',
      orderId: order.orderId,
      ipId: order.ipId,
      licenseTokenId,
      btcTxId: paymentReference,
      attestationHash,
      contentHash,
      timestamp: Date.now()
    }
    const evidenceJson = JSON.stringify(evidencePayload, null, 2)
    const evidenceHash = sha256Hex(evidenceJson)

    let evidenceStored = false
    try {
      await convex.mutation('licenses:storeEvidencePayload' as any, {
        orderId: order.orderId,
        payload: evidenceJson
      })
      evidenceStored = true
    } catch (error) {
      console.warn('Failed to persist license evidence payload:', error)
    }

    const evidenceResult = await publishEvidence({
      ...evidencePayload,
      evidenceHash
    })

    let constellationStatus: 'ok' | 'failed' | 'skipped' = 'skipped'
    let constellationTx = ''
    let constellationExplorerUrl = ''
    let constellationAnchoredAt: number | undefined
    let constellationError: string | undefined

    if (evidenceResult.status === 'ok') {
      constellationStatus = 'ok'
      constellationTx = evidenceResult.txHash
      constellationExplorerUrl = evidenceResult.explorerUrl
      constellationAnchoredAt = Date.now()
    } else if (evidenceResult.status === 'error') {
      constellationStatus = 'failed'
      constellationError = evidenceResult.message
    } else {
      constellationStatus = 'skipped'
      constellationError = evidenceResult.reason
    }

    const archive = await createLicenseArchive({
      assetBuffer: mediaBuffer,
      assetFileName:
        new URL(mediaUrl).pathname.split('/').pop() ?? 'licensed-asset.bin',
      storyLicenseId: licenseTokenId,
      btcTxId: paymentReference,
      constellationTx,
      attestationHash,
      contentHash,
      licenseTokenId
    })
    const archiveBuffer = Buffer.from(archive.archiveBase64, 'base64')
    const archiveSize = archiveBuffer.length
    const archiveFileName =
      archive.suggestedFileName ??
      `lexlink-license-${slugify(order.orderId)}.zip`

    let c2paArchiveUri: string | undefined
    try {
      c2paArchiveUri = await uploadBytes(
        archiveFileName,
        new Uint8Array(archiveBuffer)
      )
    } catch (error) {
      console.warn('Failed to pin C2PA archive to IPFS:', error)
    }
    const c2paDownloadUrl = c2paArchiveUri
      ? ipfsGatewayUrl(c2paArchiveUri)
      : null

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
      hasConstellationEvidence: constellationStatus === 'ok',
      hasC2paArchive: Boolean(c2paArchiveUri ?? archive.archiveBase64),
      trainingUnits: order.trainingUnits
    })

    await convex.mutation('licenses:markCompleted' as any, {
      orderId: order.orderId,
      btcTxId: paymentReference,
      attestationHash,
      constellationTx,
      constellationExplorerUrl,
      constellationAnchoredAt,
      constellationStatus,
      constellationError,
      tokenOnChainId: licenseTokenId,
      contentHash,
      c2paHash: archive.archiveHash,
      c2paArchiveUri: c2paArchiveUri,
      c2paArchiveFileName: archiveFileName,
      c2paArchiveSize: archiveSize,
      vcDocument: vcJson,
      vcHash: vc.hash,
      complianceScore,
      ckbtcMintedSats: minted?.sats,
      ckbtcBlockIndex: minted?.blockIndex,
      evidencePayload: evidenceStored ? evidenceJson : undefined
    })

    await recordEvent({
      actor,
      action: 'license.sale_completed',
      payload: {
        orderId: order.orderId,
        ipId: order.ipId,
        btcTxId: paymentReference,
        constellationTx,
        constellationExplorerUrl,
        constellationAnchoredAt,
        licenseTokenId,
        paymentMode,
        constellationStatus,
        ...(constellationError ? { constellationError } : {}),
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
      constellationExplorerUrl,
      constellationAnchoredAt,
      complianceScore,
      contentHash,
      c2paArchive: {
        base64: archive.archiveBase64,
        hash: archive.archiveHash,
        fileName: archiveFileName,
        uri: c2paArchiveUri ?? null,
        downloadUrl: c2paDownloadUrl,
        size: archiveSize
      },
      vcDocument: vcJson,
      vcHash: vc.hash,
      paymentReference,
      constellationStatus,
      constellationError: constellationError ?? null,
      minted
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? 'unknown_error')
    try {
      await convex.mutation('licenses:markFinalizationFailed' as any, {
        orderId: order.orderId,
        error: message
      })
    } catch (persistError) {
      console.error(
        'Failed to persist license finalization failure state:',
        persistError
      )
    }
    throw error instanceof Error ? error : new Error(message)
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
  if (actorOverride && actorOverride.role !== 'operator') {
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

  if (isSystemActor(actor)) {
    const ipOwners = new Map<string, string>()
    const resolvedIpOwner = await ensureIpOwner(ip, convex)
    if (resolvedIpOwner) {
      ipOwners.set(ip.ipId, resolvedIpOwner)
    }
    await ensureLicenseOwner({
      license: order,
      convex,
      ipOwners
    })
  } else {
    await assertActorOwnsLicense({ license: order, ip, actor, convex })
  }

  const targetReceiver =
    receiver ??
    ((order.mintTo ?? order.buyer) as `0x${string}` | undefined)
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
      throw new Error(
        'Provide a Bitcoin transaction hash for BTC mode finalization'
      )
    }
  } else {
    if (!env.CKBTC_LEDGER_CANISTER_ID) {
      throw new Error(
        'ckBTC ledger is not configured; cannot verify direct ledger transfer.'
      )
    }
    const escrowPrincipal =
      env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
    if (!escrowPrincipal) {
      throw new Error(
        'Escrow principal not configured for ckBTC ledger settlement.'
      )
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

    if (ledgerBalance < required || required === 0n) {
      throw new Error(
        'ckBTC transfer not detected yet. Wait for the ledger balance to update.'
      )
    }

    if (ledgerBalance > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('ckBTC balance exceeds supported range for finalization.')
    }

    const ledgerAmount = Number(ledgerBalance)
    minted = {
      sats: ledgerAmount
    }
    paymentReference =
      paymentReference && paymentReference.length > 0
        ? paymentReference
        : `icrc-ledger-${orderId}-${Date.now()}`
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
    constellationExplorerUrl: result.constellationExplorerUrl,
    constellationAnchoredAt: result.constellationAnchoredAt,
    constellationStatus: result.constellationStatus,
    constellationError: result.constellationError,
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
  const convex = getConvexClient()
  const ip = (await convex.query('ipAssets:getById' as any, {
    ipId: payload.ipId
  })) as IpRecord | null

  if (!ip) {
    throw new Error('IP asset not found')
  }

  await assertActorOwnsIp({ ip, actor, convex })

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

  const evidencePayload = {
    kind: 'DISPUTE_RAISED',
    disputeId,
    ipId: payload.ipId,
    targetTag: payload.targetTag,
    evidenceCid: payload.evidenceCid,
    livenessSeconds,
    bond: payload.bond ?? 0,
    txHash,
    timestamp: Date.now()
  }

  const evidenceJson = JSON.stringify(evidencePayload, null, 2)
  const evidenceHash = sha256Hex(evidenceJson)

  const disputeEvidence = await publishEvidence({
    ...evidencePayload,
    evidenceHash
  })
  const constellationTx =
    disputeEvidence.status === 'ok' ? disputeEvidence.txHash : ''
  const constellationExplorerUrl =
    disputeEvidence.status === 'ok' ? disputeEvidence.explorerUrl : ''

  await convex.mutation('disputes:insert' as any, {
    disputeId,
    ipId: payload.ipId,
    targetTag: payload.targetTag,
    evidenceCid: payload.evidenceCid,
    txHash,
    evidenceHash,
    constellationTx,
    constellationExplorerUrl,
    status: 'raised',
    livenessSeconds,
    bond: payload.bond ?? 0,
    ownerPrincipal: ip.ownerPrincipal ?? actor.principal
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
      constellationExplorerUrl,
      txHash
    },
    resourceId: disputeId
  })

  return {
    disputeId,
    txHash,
    evidenceHash,
    constellationTx,
    constellationExplorerUrl
  }
}

export async function loadDashboardData() {
  const actor = await requireSession()
  const convex = getConvexClient()
  const [ipsRaw, licensesRaw, disputesRaw, trainingRaw] = await Promise.all([
    convex.query('ipAssets:list' as any, {}),
    convex.query('licenses:list' as any, {}),
    convex.query('disputes:list' as any, {}),
    convex.query('trainingBatches:list' as any, {})
  ])

  const ipOwners = new Map<string, string>()

  const ips = [] as IpRecord[]
  for (const ip of ipsRaw as IpRecord[]) {
    const owner = await ensureIpOwner(ip, convex)
    if (owner) {
      ipOwners.set(ip.ipId, owner)
    }
    if (owner === actor.principal) {
      ips.push({
        ...ip,
        ownerPrincipal: owner
      })
    }
  }

  const licenses = [] as LicenseRecord[]
  for (const license of licensesRaw as LicenseRecord[]) {
    const owner = await ensureLicenseOwner({
      license,
      convex,
      ipOwners
    })
    if (owner === actor.principal) {
      licenses.push({
        ...license,
        ownerPrincipal: owner
      })
    }
  }

  const disputes = [] as DisputeRecord[]
  for (const dispute of disputesRaw as DisputeRecord[]) {
    const owner = await ensureDisputeOwner({
      dispute,
      convex,
      ipOwners
    })
    if (owner === actor.principal) {
      disputes.push({
        ...dispute,
        ownerPrincipal: owner
      })
    }
  }

  const trainingBatches = [] as TrainingBatchRecord[]
  for (const batch of trainingRaw as TrainingBatchRecord[]) {
    const owner = await ensureTrainingOwner({
      batch,
      convex,
      ipOwners
    })
    if (owner === actor.principal) {
      trainingBatches.push({
        ...batch,
        ownerPrincipal: owner
      })
    }
  }

  return {
    principal: actor.principal,
    ips,
    licenses,
    disputes,
    trainingBatches
  }
}

export async function loadBuyerProfile() {
  const actor = await requireSession()
  const convex = getConvexClient()

  const profile = (await convex.query('profiles:getByPrincipal' as any, {
    principal: actor.principal
  })) as (ProfileRecord & { _id: string }) | null

  return {
    principal: actor.principal,
    defaultMintTo: profile?.defaultMintTo ?? null
  }
}

export async function loadBuyerCkbtcBalance() {
  if (!env.CKBTC_LEDGER_CANISTER_ID) {
    return { enabled: false as const, reason: 'ledger_unconfigured' as const }
  }

  const actor = await requireSession()

  try {
    const [metadata, balance] = await Promise.all([
      getLedgerMetadata(),
      getLedgerAccountBalance({
        owner: actor.principal
      })
    ])

    return {
      enabled: true as const,
      principal: actor.principal,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      raw: balance.toString(),
      formatted: formatTokenAmount(balance, metadata.decimals)
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to query ckBTC balance'
    return {
      enabled: false as const,
      reason: message
    }
  }
}

export async function loadBuyerPurchases() {
  const actor = await requireSession()
  const convex = getConvexClient()

  const [ordersRaw, ipsRaw] = await Promise.all([
    convex.query('licenses:listByBuyerPrincipal' as any, {
      buyerPrincipal: actor.principal
    }),
    convex.query('ipAssets:list' as any, {})
  ])

  const ipMap = new Map<string, IpRecord>()
  for (const ip of ipsRaw as IpRecord[]) {
    ipMap.set(ip.ipId, ip)
  }

  return (ordersRaw as LicenseRecord[]).map(order => ({
    ...order,
    ipTitle: ipMap.get(order.ipId)?.title ?? order.ipId,
    mintTo: order.mintTo ?? order.buyer ?? null,
    constellationExplorerUrl: order.constellationExplorerUrl ?? null,
    constellationAnchoredAt: order.constellationAnchoredAt ?? null
  }))
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

  await assertActorOwnsIp({ ip, actor, convex })

  const batchId = crypto.randomUUID()
  const payload = {
    kind: 'TRAINING_BATCH',
    ipId,
    batchId,
    units,
    timestamp: Date.now()
  }
  const payloadJson = JSON.stringify(payload, null, 2)
  const evidenceHash = sha256Hex(payloadJson)
  const trainingEvidence = await publishEvidence({
    ...payload,
    evidenceHash
  })
  const constellationTx =
    trainingEvidence.status === 'ok' ? trainingEvidence.txHash : ''
  const constellationExplorerUrl =
    trainingEvidence.status === 'ok' ? trainingEvidence.explorerUrl : ''

  await convex.mutation('trainingBatches:insert' as any, {
    batchId,
    ipId,
    units,
    evidenceHash,
    constellationTx,
    constellationExplorerUrl,
    payload: payloadJson,
    ownerPrincipal: ip.ownerPrincipal ?? actor.principal
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
      hasC2paArchive: Boolean(license.c2paArchiveUri),
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
      constellationExplorerUrl,
      constellationStatus: trainingEvidence.status,
      evidenceHash
    },
    resourceId: batchId
  })

  return {
    batchId,
    constellationTx,
    constellationExplorerUrl,
    constellationStatus: trainingEvidence.status,
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
  const actor = await requireSession()
  const convex = getConvexClient()
  const records = (await convex.query('events:listRecent' as any, {
    limit
  })) as Array<Record<string, unknown>>

  return records
    .filter(event => {
      const eventPrincipal =
        typeof event.actorPrincipal === 'string'
          ? (event.actorPrincipal as string)
          : undefined
      return !eventPrincipal || eventPrincipal === actor.principal
    })
    .map(event => ({
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

type PublicLicenseRecord = {
  orderId: string
  ipId: string
  ipTitle: string
  amountSats?: number
  btcAddress: string
  buyer?: string | null
  buyerPrincipal?: string | null
  mintTo?: string | null
  paymentMode?: string
  status: string
  ckbtcSubaccount?: string
  ckbtcMintedSats?: number
  ckbtcBlockIndex?: number
  btcTxId?: string
  attestationHash?: string
  constellationTx?: string
  constellationExplorerUrl?: string | null
  constellationAnchoredAt?: number | null
  constellationStatus?: string | null
  constellationError?: string | null
  tokenOnChainId?: string
  licenseTermsId?: string
  createdAt: number
  updatedAt?: number
  fundedAt?: number
  finalizedAt?: number
  network?: string
  c2paArchiveUri?: string | null
  c2paArchiveFileName?: string | null
  c2paArchiveSize?: number | null
  contentHash?: string
  c2paHash?: string
  vcDocument?: string | null
  vcHash?: string
  evidencePayload?: string | null
  trainingUnits?: number
  complianceScore?: number
}

type PublicTrainingBatchRecord = {
  batchId: string
  ipId: string
  units: number
  evidenceHash: string
  constellationTx: string
  constellationExplorerUrl?: string | null
  payload?: string | null
  createdAt: number
}

export async function loadOrderReceipt(orderId: string) {
  if (!orderId) return null
  const convex = getConvexClient()
  const record = (await convex.query('licenses:getPublic' as any, {
    orderId
  })) as PublicLicenseRecord | null

  if (!record) {
    return null
  }

  const mintTo = record.mintTo ?? record.buyer ?? null

  return {
    ...record,
    buyer: mintTo ?? undefined,
    mintTo,
    constellationExplorerUrl: record.constellationExplorerUrl ?? null,
    constellationAnchoredAt: record.constellationAnchoredAt ?? null,
    constellationStatus: record.constellationStatus ?? null,
    constellationError: record.constellationError ?? null,
    vcDocument: record.vcDocument ?? null,
    evidencePayload: record.evidencePayload ?? null,
    c2paArchiveUrl: record.c2paArchiveUri
      ? ipfsGatewayUrl(record.c2paArchiveUri)
      : null
  }
}

export async function loadInvoicePublic(orderId: string) {
  const receipt = await loadOrderReceipt(orderId)
  if (!receipt) {
    return null
  }
  const { vcDocument, evidencePayload, ...publicInvoice } = receipt
  return publicInvoice
}

export async function loadTrainingReceipt(batchId: string) {
  if (!batchId) return null
  const convex = getConvexClient()
  const record = (await convex.query('trainingBatches:get' as any, {
    batchId
  })) as (PublicTrainingBatchRecord & { ownerPrincipal?: string }) | null

  if (!record) {
    return null
  }

  const ip = (await convex.query('ipAssets:getById' as any, {
    ipId: record.ipId
  })) as IpRecord | null

  return {
    ...record,
    ipTitle: ip?.title ?? record.ipId,
    payload: record.payload ?? null,
    constellationExplorerUrl: record.constellationExplorerUrl ?? null
  }
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

  const ipOwners = new Map<string, string>()
  const resolvedIpOwner = await ensureIpOwner(ip, convex)
  if (resolvedIpOwner) {
    ipOwners.set(ip.ipId, resolvedIpOwner)
  }

  await ensureLicenseOwner({
    license: order,
    convex,
    ipOwners
  })

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
      throw new Error(
        'Provide a Bitcoin transaction hash for BTC mode finalization'
      )
    }
  } else {
    if (!env.CKBTC_LEDGER_CANISTER_ID) {
      throw new Error(
        'ckBTC ledger is not configured; cannot verify direct ledger transfer.'
      )
    }
    const escrowPrincipal =
      env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
    if (!escrowPrincipal) {
      throw new Error(
        'Escrow principal not configured for ckBTC ledger settlement.'
      )
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

    if (ledgerBalance < required || required === 0n) {
      throw new Error('ckBTC transfer not detected yet.')
    }

    if (ledgerBalance > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('ckBTC balance exceeds supported range for finalization.')
    }

    const ledgerAmount = Number(ledgerBalance)
    minted = {
      sats: ledgerAmount
    }
    paymentReference =
      paymentReference && paymentReference.length > 0
        ? paymentReference
        : `icrc-ledger-${orderId}-${Date.now()}`
  }

  const systemActor: SessionActor = {
    principal: 'system@lexlink',
    role: 'operator'
  }

  const targetReceiver =
    receiver ?? ((order.mintTo ?? order.buyer) as `0x${string}` | undefined)

  if (!targetReceiver) {
    throw new Error('Receiver wallet is required to mint license token.')
  }

  return finalizeOrder({
    order,
    ip,
    paymentReference,
    receiver: targetReceiver,
    actor: systemActor,
    convex,
    paymentMode,
    minted
  })
}
