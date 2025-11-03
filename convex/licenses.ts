import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const licenses = await ctx.db.query('licenses').collect()
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

export const insert = mutationGeneric({
  args: {
    orderId: v.string(),
    ipId: v.string(),
    buyer: v.string(),
    btcAddress: v.string(),
    licenseTermsId: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('licenses', {
      ...args,
      btcTxId: '',
      attestationHash: '',
      constellationTx: '',
      tokenOnChainId: '',
      status: 'awaiting_payment',
      createdAt: Date.now()
    })
  }
})

export const markCompleted = mutationGeneric({
  args: {
    orderId: v.string(),
    btcTxId: v.string(),
    attestationHash: v.string(),
    constellationTx: v.string(),
    tokenOnChainId: v.string()
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
      status: 'completed'
    })
  }
})
