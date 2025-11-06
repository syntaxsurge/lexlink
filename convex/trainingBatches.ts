import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const listByIp = queryGeneric({
  args: { ipId: v.string() },
  handler: async (ctx, args) => {
    const batches = await ctx.db
      .query('trainingBatches')
      .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
      .collect()
    return batches.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const insert = mutationGeneric({
  args: {
    batchId: v.string(),
    ipId: v.string(),
    units: v.number(),
    evidenceHash: v.string(),
    constellationTx: v.string(),
    payload: v.optional(v.string()),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('trainingBatches', {
      ...args,
      createdAt: Date.now()
    })
  }
})
export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const batches = await ctx.db.query('trainingBatches').collect()
    return batches.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const get = queryGeneric({
  args: { batchId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('trainingBatches')
      .withIndex('by_batchId', q => q.eq('batchId', args.batchId))
      .unique()
  }
})

export const assignOwner = mutationGeneric({
  args: {
    batchId: v.string(),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('trainingBatches')
      .withIndex('by_batchId', q => q.eq('batchId', args.batchId))
      .unique()

    if (!record) {
      throw new Error('Training batch not found')
    }

    if (
      record.ownerPrincipal &&
      record.ownerPrincipal !== args.ownerPrincipal
    ) {
      throw new Error('Training batch already assigned to a different principal')
    }

    await ctx.db.patch(record._id, {
      ownerPrincipal: args.ownerPrincipal
    })
  }
})
