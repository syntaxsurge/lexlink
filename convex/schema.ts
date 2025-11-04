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
    createdAt: v.number()
  }).index('by_ipId', ['ipId']),
  licenses: defineTable({
    orderId: v.string(),
    ipId: v.string(),
    buyer: v.string(),
    btcAddress: v.string(),
    btcTxId: v.string(),
    attestationHash: v.string(),
    constellationTx: v.string(),
    tokenOnChainId: v.string(),
    licenseTermsId: v.string(),
    status: v.string(),
    createdAt: v.number()
  })
    .index('by_orderId', ['orderId'])
    .index('by_ipId', ['ipId']),
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
    createdAt: v.number()
  })
    .index('by_disputeId', ['disputeId'])
    .index('by_ipId', ['ipId'])
})
