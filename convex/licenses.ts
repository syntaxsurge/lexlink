import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const licenses = await ctx.db.query('licenses').collect()
    return licenses.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const listByIp = queryGeneric({
  args: { ipId: v.string() },
  handler: async (ctx, args) => {
    const licenses = await ctx.db
      .query('licenses')
      .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
      .collect()
    return licenses.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const get = queryGeneric({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()
  }
})

export const listByStatus = queryGeneric({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('licenses')
      .withIndex('by_status', q => q.eq('status', args.status))
      .collect()
  }
})

export const insert = mutationGeneric({
  args: {
    orderId: v.string(),
    ipId: v.string(),
    buyer: v.string(),
    btcAddress: v.string(),
    licenseTermsId: v.string(),
    amountSats: v.number(),
    network: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.insert('licenses', {
      ...args,
      btcTxId: '',
      attestationHash: '',
      constellationTx: '',
      tokenOnChainId: '',
      contentHash: '',
      c2paHash: '',
      c2paArchive: '',
      vcDocument: '',
      vcHash: '',
      complianceScore: 0,
      trainingUnits: 0,
      status: 'pending',
      confirmations: 0,
      createdAt: now,
      updatedAt: now,
      fundedAt: undefined,
      finalizedAt: undefined
    })
  }
})

export const markCompleted = mutationGeneric({
  args: {
    orderId: v.string(),
    btcTxId: v.string(),
    attestationHash: v.string(),
    constellationTx: v.string(),
    tokenOnChainId: v.string(),
    contentHash: v.string(),
    c2paHash: v.string(),
    c2paArchive: v.string(),
    vcDocument: v.string(),
    vcHash: v.string(),
    complianceScore: v.number()
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    await ctx.db.patch(license._id, {
      btcTxId: args.btcTxId,
      attestationHash: args.attestationHash,
      constellationTx: args.constellationTx,
      tokenOnChainId: args.tokenOnChainId,
      contentHash: args.contentHash,
      c2paHash: args.c2paHash,
      c2paArchive: args.c2paArchive,
      vcDocument: args.vcDocument,
      vcHash: args.vcHash,
      complianceScore: args.complianceScore,
      status: 'finalized',
      finalizedAt: Date.now(),
      updatedAt: Date.now()
    })
  }
})

export const setTrainingMetrics = mutationGeneric({
  args: {
    orderId: v.string(),
    trainingUnits: v.number(),
    complianceScore: v.number()
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    await ctx.db.patch(license._id, {
      trainingUnits: args.trainingUnits,
      complianceScore: args.complianceScore
    })
  }
})

export const updateFundingState = mutationGeneric({
  args: {
    orderId: v.string(),
    status: v.string(),
    btcTxId: v.optional(v.string()),
    confirmations: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    await ctx.db.patch(license._id, {
      status: args.status,
      btcTxId: args.btcTxId ?? license.btcTxId,
      confirmations: args.confirmations ?? license.confirmations ?? 0,
      fundedAt: args.status === 'funded' ? Date.now() : license.fundedAt,
      updatedAt: Date.now()
    })
  }
})
