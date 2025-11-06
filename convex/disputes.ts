import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const disputes = await ctx.db.query('disputes').collect()
    return disputes.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const getById = queryGeneric({
  args: {
    disputeId: v.string()
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('disputes')
      .withIndex('by_disputeId', q => q.eq('disputeId', args.disputeId))
      .unique()
  }
})

export const insert = mutationGeneric({
  args: {
    disputeId: v.string(),
    ipId: v.string(),
    targetTag: v.string(),
    evidenceCid: v.string(),
    evidenceUri: v.optional(v.string()),
    evidenceNote: v.optional(v.string()),
    evidenceAttachments: v.optional(
      v.array(
        v.object({
          uri: v.string(),
          name: v.string(),
          mimeType: v.string(),
          size: v.number(),
          source: v.union(v.literal('upload'), v.literal('url')),
          originalUrl: v.optional(v.string())
        })
      )
    ),
    txHash: v.string(),
    evidenceHash: v.string(),
    constellationTx: v.string(),
    constellationExplorerUrl: v.optional(v.string()),
    status: v.string(),
    livenessSeconds: v.number(),
    livenessDeadline: v.optional(v.number()),
    bond: v.number(),
    reporterBond: v.optional(v.number()),
    counterBond: v.optional(v.number()),
    ownerPrincipal: v.optional(v.string()),
    reporterPrincipal: v.string(),
    watchers: v.optional(v.array(v.string())),
    assertionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('disputes', {
      ...args,
      createdAt: Date.now()
    })
  }
})

export const setStatus = mutationGeneric({
  args: {
    disputeId: v.string(),
    status: v.string(),
    resolvedAt: v.optional(v.number()),
    resolutionTx: v.optional(v.string()),
    resolutionStatus: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db
      .query('disputes')
      .withIndex('by_disputeId', q => q.eq('disputeId', args.disputeId))
      .unique()

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    await ctx.db.patch(dispute._id, {
      status: args.status,
      resolvedAt: args.resolvedAt ?? dispute.resolvedAt,
      resolutionTx: args.resolutionTx ?? dispute.resolutionTx,
      resolutionStatus: args.resolutionStatus ?? dispute.resolutionStatus
    })
  }
})

export const assignOwner = mutationGeneric({
  args: {
    disputeId: v.string(),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('disputes')
      .withIndex('by_disputeId', q => q.eq('disputeId', args.disputeId))
      .unique()

    if (!record) {
      throw new Error('Dispute not found')
    }

    if (
      record.ownerPrincipal &&
      record.ownerPrincipal !== args.ownerPrincipal
    ) {
      throw new Error('Dispute already assigned to a different principal')
    }

    const watchers = new Set(record.watchers ?? [])
    watchers.add(args.ownerPrincipal)

    await ctx.db.patch(record._id, {
      ownerPrincipal: args.ownerPrincipal,
      watchers: Array.from(watchers)
    })
  }
})

export const setResponse = mutationGeneric({
  args: {
    disputeId: v.string(),
    status: v.string(),
    responseTxHash: v.string(),
    responseEvidenceCid: v.string(),
    responseEvidenceUri: v.string(),
    responseNote: v.optional(v.string()),
    responseAttachments: v.optional(
      v.array(
        v.object({
          uri: v.string(),
          name: v.string(),
          mimeType: v.string(),
          size: v.number(),
          source: v.union(v.literal('upload'), v.literal('url')),
          originalUrl: v.optional(v.string())
        })
      )
    ),
    respondedAt: v.number(),
    assertionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db
      .query('disputes')
      .withIndex('by_disputeId', q => q.eq('disputeId', args.disputeId))
      .unique()

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    await ctx.db.patch(dispute._id, {
      status: args.status,
      responseTxHash: args.responseTxHash,
      responseEvidenceCid: args.responseEvidenceCid,
      responseEvidenceUri: args.responseEvidenceUri,
      responseNote: args.responseNote,
      responseAttachments: args.responseAttachments,
      respondedAt: args.respondedAt,
      assertionId: args.assertionId ?? dispute.assertionId
    })
  }
})

export const setWatchers = mutationGeneric({
  args: {
    disputeId: v.string(),
    watchers: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db
      .query('disputes')
      .withIndex('by_disputeId', q => q.eq('disputeId', args.disputeId))
      .unique()

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    await ctx.db.patch(dispute._id, {
      watchers: args.watchers
    })
  }
})
