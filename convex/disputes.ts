import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const disputes = await ctx.db.query('disputes').collect()
    return disputes.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const insert = mutationGeneric({
  args: {
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
    ownerPrincipal: v.string()
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
    status: v.string()
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
      status: args.status
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

    await ctx.db.patch(record._id, {
      ownerPrincipal: args.ownerPrincipal
    })
  }
})
