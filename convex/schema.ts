import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  ips: defineTable({
    ipId: v.string(),
    title: v.string(),
    creatorAddress: v.string(),
    priceSats: v.number(),
    royaltyBps: v.number(),
    licenseTermsId: v.string(),
    description: v.string(),
    createdAt: v.number(),
    imageUrl: v.string(),
    imageHash: v.string(),
    mediaUrl: v.string(),
    mediaType: v.string(),
    mediaHash: v.string(),
    ipMetadataUri: v.string(),
    ipMetadataHash: v.string(),
    nftMetadataUri: v.string(),
    nftMetadataHash: v.string(),
    commercialUse: v.boolean(),
    derivativesAllowed: v.boolean(),
    ownerPrincipal: v.optional(v.string())
  })
    .index('by_ipId', ['ipId'])
    .index('by_ownerPrincipal', ['ownerPrincipal']),
  licenses: defineTable({
    orderId: v.string(),
    ipId: v.string(),
    buyer: v.string(),
    btcAddress: v.string(),
    network: v.optional(v.string()),
    amountSats: v.optional(v.number()),
    paymentMode: v.optional(v.string()),
    ckbtcSubaccount: v.optional(v.string()),
    ckbtcMintedSats: v.optional(v.number()),
    ckbtcBlockIndex: v.optional(v.number()),
    btcTxId: v.string(),
    attestationHash: v.string(),
    constellationTx: v.string(),
    tokenOnChainId: v.string(),
    licenseTermsId: v.string(),
    status: v.string(),
    confirmations: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    fundedAt: v.optional(v.number()),
    finalizedAt: v.optional(v.number()),
    contentHash: v.string(),
    c2paHash: v.string(),
    c2paArchive: v.string(),
    vcDocument: v.string(),
    vcHash: v.string(),
    complianceScore: v.number(),
    trainingUnits: v.number(),
    ownerPrincipal: v.optional(v.string())
  })
    .index('by_orderId', ['orderId'])
    .index('by_ipId', ['ipId'])
    .index('by_status', ['status'])
    .index('by_ownerPrincipal', ['ownerPrincipal']),
  disputes: defineTable({
    disputeId: v.string(),
    ipId: v.string(),
    targetTag: v.string(),
    evidenceCid: v.string(),
    txHash: v.string(),
    evidenceHash: v.string(),
    constellationTx: v.string(),
    status: v.string(),
    livenessSeconds: v.number(),
    bond: v.number(),
    createdAt: v.number(),
    ownerPrincipal: v.optional(v.string())
  })
    .index('by_disputeId', ['disputeId'])
    .index('by_ipId', ['ipId'])
    .index('by_ownerPrincipal', ['ownerPrincipal']),
  trainingBatches: defineTable({
    batchId: v.string(),
    ipId: v.string(),
    units: v.number(),
    evidenceHash: v.string(),
    constellationTx: v.string(),
    createdAt: v.number(),
    ownerPrincipal: v.optional(v.string())
  })
    .index('by_batchId', ['batchId'])
    .index('by_ipId', ['ipId'])
    .index('by_ownerPrincipal', ['ownerPrincipal']),
  users: defineTable({
    address: v.optional(v.string()),
    principal: v.optional(v.string()),
    role: v.union(
      v.literal('operator'),
      v.literal('creator'),
      v.literal('viewer')
    ),
    createdAt: v.number()
  })
    .index('by_address', ['address'])
    .index('by_principal', ['principal']),
  events: defineTable({
    eventId: v.string(),
    actorAddress: v.optional(v.string()),
    actorPrincipal: v.optional(v.string()),
    action: v.string(),
    resourceId: v.optional(v.string()),
    payload: v.string(),
    createdAt: v.number()
  })
    .index('by_eventId', ['eventId'])
    .index('by_actorAddress', ['actorAddress'])
    .index('by_actorPrincipal', ['actorPrincipal'])
    .index('by_action', ['action'])
    .index('by_resourceId', ['resourceId'])
})
