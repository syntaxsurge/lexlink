import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'

export const getByPrincipal = queryGeneric({
  args: {
    principal: v.string()
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('profiles')
      .withIndex('by_principal', q => q.eq('principal', args.principal))
      .unique()
  }
})

export const upsert = mutationGeneric({
  args: {
    principal: v.string(),
    defaultMintTo: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_principal', q => q.eq('principal', args.principal))
      .unique()
    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        defaultMintTo: args.defaultMintTo,
        updatedAt: now
      })
      return existing._id
    }

    return ctx.db.insert('profiles', {
      principal: args.principal,
      defaultMintTo: args.defaultMintTo,
      createdAt: now,
      updatedAt: now
    })
  }
})
