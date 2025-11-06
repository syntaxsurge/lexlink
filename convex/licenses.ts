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

export const getPublic = queryGeneric({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      return null
    }

    const ip = await ctx.db
      .query('ips')
      .withIndex('by_ipId', q => q.eq('ipId', license.ipId))
      .unique()

    return {
      orderId: license.orderId,
      ipId: license.ipId,
      ipTitle: ip?.title ?? license.ipId,
      amountSats: license.amountSats,
      btcAddress: license.btcAddress,
      buyer: license.buyer,
      paymentMode: license.paymentMode,
      status: license.status,
      ckbtcSubaccount: license.ckbtcSubaccount,
      ckbtcMintedSats: license.ckbtcMintedSats,
      ckbtcBlockIndex: license.ckbtcBlockIndex,
      btcTxId: license.btcTxId,
      attestationHash: license.attestationHash,
      constellationTx: license.constellationTx,
      tokenOnChainId: license.tokenOnChainId,
      licenseTermsId: license.licenseTermsId,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
      fundedAt: license.fundedAt,
      finalizedAt: license.finalizedAt,
      network: license.network,
      c2paArchiveUri: license.c2paArchiveUri ?? null,
      c2paArchiveFileName: license.c2paArchiveFileName ?? null,
      c2paArchiveSize: license.c2paArchiveSize ?? null,
      vcHash: license.vcHash,
      complianceScore: license.complianceScore
    }
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
    network: v.string(),
    paymentMode: v.string(),
    ckbtcSubaccount: v.optional(v.string()),
    ownerPrincipal: v.string()
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
      vcDocument: '',
      vcHash: '',
      complianceScore: 0,
      trainingUnits: 0,
      status: 'pending',
      confirmations: 0,
      ckbtcMintedSats: undefined,
      ckbtcBlockIndex: undefined,
      createdAt: now,
      updatedAt: now,
      fundedAt: undefined,
      finalizedAt: undefined
    })
  }
})

export const assignOwner = mutationGeneric({
  args: {
    orderId: v.string(),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!record) {
      throw new Error('License order not found')
    }

    if (
      record.ownerPrincipal &&
      record.ownerPrincipal !== args.ownerPrincipal
    ) {
      throw new Error('License order already assigned to a different principal')
    }

    await ctx.db.patch(record._id, {
      ownerPrincipal: args.ownerPrincipal
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
    c2paArchiveUri: v.optional(v.string()),
    c2paArchiveFileName: v.optional(v.string()),
    c2paArchiveSize: v.optional(v.number()),
    vcDocument: v.string(),
    vcHash: v.string(),
    complianceScore: v.number(),
    ckbtcMintedSats: v.optional(v.number()),
    ckbtcBlockIndex: v.optional(v.number())
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
      c2paArchiveUri: args.c2paArchiveUri,
      c2paArchiveFileName: args.c2paArchiveFileName,
      c2paArchiveSize: args.c2paArchiveSize,
      vcDocument: args.vcDocument,
      vcHash: args.vcHash,
      complianceScore: args.complianceScore,
      ckbtcMintedSats: args.ckbtcMintedSats ?? license.ckbtcMintedSats,
      ckbtcBlockIndex: args.ckbtcBlockIndex ?? license.ckbtcBlockIndex,
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
    confirmations: v.optional(v.number()),
    ckbtcMintedSats: v.optional(v.number()),
    ckbtcBlockIndex: v.optional(v.number())
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
      ckbtcMintedSats:
        typeof args.ckbtcMintedSats === 'number'
          ? args.ckbtcMintedSats
          : license.ckbtcMintedSats,
      ckbtcBlockIndex:
        typeof args.ckbtcBlockIndex === 'number'
          ? args.ckbtcBlockIndex
          : license.ckbtcBlockIndex,
      fundedAt: args.status === 'funded' ? Date.now() : license.fundedAt,
      updatedAt: Date.now()
    })
  }
})

export const listRecent = queryGeneric({
  args: {
    limit: v.number()
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query('licenses').collect()
    const sorted = items.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
    return sorted.slice(0, Math.max(0, args.limit))
  }
})
