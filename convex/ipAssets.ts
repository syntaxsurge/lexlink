import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const list = queryGeneric({
  args: {},
  handler: async ctx => {
    const ips = await ctx.db.query('ips').collect()
    return ips.sort((a, b) => b.createdAt - a.createdAt)
  }
})

export const getById = queryGeneric({
  args: { ipId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('ips')
      .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
      .unique()
  }
})

export const insert = mutationGeneric({
  args: {
    ipId: v.string(),
    title: v.string(),
    creatorAddress: v.string(),
    priceSats: v.number(),
    royaltyBps: v.number(),
    licenseTermsId: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('ips', {
      ...args,
      createdAt: Date.now()
    })
  }
})
