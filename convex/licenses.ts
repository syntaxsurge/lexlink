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

    const mintTo = license.mintTo ?? license.buyer ?? null

    return {
      orderId: license.orderId,
      ipId: license.ipId,
      ipTitle: ip?.title ?? license.ipId,
      amountSats: license.amountSats,
      btcAddress: license.btcAddress,
      buyer: mintTo,
      buyerPrincipal: license.buyerPrincipal ?? null,
      mintTo,
      status: license.status,
      ckbtcSubaccount: license.ckbtcSubaccount,
      ckbtcMintedSats: license.ckbtcMintedSats,
      ckbtcBlockIndex: license.ckbtcBlockIndex,
      btcTxId: license.btcTxId,
      attestationHash: license.attestationHash,
      constellationTx: license.constellationTx,
      constellationExplorerUrl: license.constellationExplorerUrl ?? null,
      constellationAnchoredAt: license.constellationAnchoredAt ?? null,
      constellationStatus: license.constellationStatus ?? null,
      constellationError: license.constellationError ?? null,
      tokenOnChainId: license.tokenOnChainId,
      licenseTermsId: license.licenseTermsId,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
      fundedAt: license.fundedAt,
      finalizedAt: license.finalizedAt,
      network: license.network,
      contentHash: license.contentHash,
      c2paHash: license.c2paHash,
      c2paArchiveUri: license.c2paArchiveUri ?? null,
      c2paArchiveFileName: license.c2paArchiveFileName ?? null,
      c2paArchiveSize: license.c2paArchiveSize ?? null,
      vcDocument: license.vcDocument,
      vcHash: license.vcHash,
      evidencePayload: license.evidencePayload ?? null,
      complianceScore: license.complianceScore
    }
  }
})

export const insert = mutationGeneric({
  args: {
    orderId: v.string(),
    ipId: v.string(),
    btcAddress: v.string(),
    licenseTermsId: v.string(),
    amountSats: v.number(),
    network: v.string(),
    ckbtcSubaccount: v.optional(v.string()),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.insert('licenses', {
      ...args,
      buyer: undefined,
      buyerPrincipal: undefined,
      mintTo: undefined,
      btcTxId: '',
      attestationHash: '',
      constellationTx: '',
      tokenOnChainId: '',
      contentHash: '',
      c2paHash: '',
      vcDocument: '',
      vcHash: '',
      complianceScore: 0,
      constellationStatus: 'pending',
      constellationError: undefined,
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

export const attachBuyer = mutationGeneric({
  args: {
    orderId: v.string(),
    buyerPrincipal: v.string(),
    mintTo: v.string()
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    if (
      license.buyerPrincipal &&
      license.buyerPrincipal !== args.buyerPrincipal
    ) {
      throw new Error('Order already claimed by a different buyer')
    }

    await ctx.db.patch(license._id, {
      buyerPrincipal: args.buyerPrincipal,
      mintTo: args.mintTo,
      buyer: args.mintTo,
      updatedAt: Date.now()
    })
  }
})

export const storeEvidencePayload = mutationGeneric({
  args: {
    orderId: v.string(),
    payload: v.string()
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
      evidencePayload: args.payload,
      updatedAt: Date.now()
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

export const requestFinalization = mutationGeneric({
  args: {
    orderId: v.string()
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    if (license.status === 'finalized') {
      return { proceed: false as const, status: 'finalized' as const }
    }

    if (license.status === 'finalizing') {
      return { proceed: false as const, status: 'finalizing' as const }
    }

    await ctx.db.patch(license._id, {
      status: 'finalizing',
      updatedAt: Date.now()
    })

    return { proceed: true as const, previousStatus: license.status ?? null }
  }
})

export const markFinalizationFailed = mutationGeneric({
  args: {
    orderId: v.string(),
    error: v.string(),
    tokenOnChainId: v.optional(v.string()),
    ckbtcMintedSats: v.optional(v.number()),
    ckbtcBlockIndex: v.optional(v.number()),
    constellationStatus: v.optional(v.string()),
    constellationError: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query('licenses')
      .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
      .unique()

    if (!license) {
      throw new Error('License order not found')
    }

    const patch: Record<string, any> = {
      status: 'failed',
      constellationStatus: args.constellationStatus ?? 'failed',
      constellationError: args.constellationError ?? args.error,
      updatedAt: Date.now()
    }

    if (typeof args.ckbtcMintedSats === 'number') {
      patch.ckbtcMintedSats = args.ckbtcMintedSats
    }
    if (typeof args.ckbtcBlockIndex === 'number') {
      patch.ckbtcBlockIndex = args.ckbtcBlockIndex
    }
    if (args.tokenOnChainId) {
      patch.tokenOnChainId = args.tokenOnChainId
    }

    await ctx.db.patch(license._id, patch)
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
    ckbtcBlockIndex: v.optional(v.number()),
    evidencePayload: v.optional(v.string()),
    constellationExplorerUrl: v.optional(v.string()),
    constellationAnchoredAt: v.optional(v.number()),
    constellationStatus: v.string(),
    constellationError: v.optional(v.string())
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
      constellationExplorerUrl:
        args.constellationExplorerUrl ?? license.constellationExplorerUrl,
      constellationAnchoredAt:
        args.constellationAnchoredAt ?? license.constellationAnchoredAt,
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
      evidencePayload: args.evidencePayload ?? license.evidencePayload,
      constellationStatus: args.constellationStatus,
      constellationError: args.constellationError,
      status: 'finalized',
      finalizedAt: Date.now(),
      updatedAt: Date.now()
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
    const sorted = items.sort(
      (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
    )
    return sorted.slice(0, Math.max(0, args.limit))
  }
})

export const listByBuyerPrincipal = queryGeneric({
  args: {
    buyerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('licenses')
      .withIndex('by_buyerPrincipal', q =>
        q.eq('buyerPrincipal', args.buyerPrincipal)
      )
      .collect()
  }
})
