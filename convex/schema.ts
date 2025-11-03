import { defineSchema, defineTable } from 'convex/server'

export default defineSchema({
  ips: defineTable({
    ipId: 'string',
    title: 'string',
    creatorAddress: 'string',
    priceSats: 'number',
    royaltyBps: 'number',
    licenseTermsId: 'string',
    createdAt: 'number'
  }).index('by_ipId', ['ipId']),
  licenses: defineTable({
    orderId: 'string',
    ipId: 'string',
    buyer: 'string',
    btcAddress: 'string',
    btcTxId: 'string',
    attestationHash: 'string',
    constellationTx: 'string',
    tokenOnChainId: 'string',
    licenseTermsId: 'string',
    status: 'string',
    createdAt: 'number'
  })
    .index('by_orderId', ['orderId'])
    .index('by_ipId', ['ipId']),
  disputes: defineTable({
    disputeId: 'string',
    ipId: 'string',
    targetTag: 'string',
    evidenceCid: 'string',
    txHash: 'string',
    evidenceHash: 'string',
    constellationTx: 'string',
    status: 'string',
    livenessSeconds: 'number',
    bond: 'number',
    createdAt: 'number'
  })
    .index('by_disputeId', ['disputeId'])
    .index('by_ipId', ['ipId'])
})
