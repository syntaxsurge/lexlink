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
    licenseTermsId: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    imageHash: v.string(),
    mediaUrl: v.string(),
    mediaType: v.string(),
    mediaHash: v.string(),
    creators: v.optional(
      v.array(
        v.object({
          name: v.string(),
          address: v.string(),
          contributionPercent: v.number(),
          role: v.optional(v.string()),
          description: v.optional(v.string()),
          socialMedia: v.optional(
            v.array(
              v.object({
                platform: v.string(),
                url: v.string()
              })
            )
          )
        })
      )
    ),
    tags: v.optional(v.array(v.string())),
    aiMetadata: v.optional(
      v.object({
        prompt: v.string(),
        model: v.string(),
        provider: v.optional(v.string()),
        enhancedPrompt: v.optional(v.string()),
        generatedAt: v.number(),
        contentHash: v.optional(v.string())
      })
    ),
    ipMetadataUri: v.string(),
    ipMetadataHash: v.string(),
    nftMetadataUri: v.string(),
    nftMetadataHash: v.string(),
    commercialUse: v.boolean(),
    derivativesAllowed: v.boolean(),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('ips', {
      ...args,
      createdAt: Date.now()
    })
  }
})

export const assignOwner = mutationGeneric({
  args: {
    ipId: v.string(),
    ownerPrincipal: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('ips')
      .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
      .unique()

    if (!record) {
      throw new Error('IP asset not found')
    }

    if (
      record.ownerPrincipal &&
      record.ownerPrincipal !== args.ownerPrincipal
    ) {
      throw new Error('IP asset already assigned to a different principal')
    }

    await ctx.db.patch(record._id, {
      ownerPrincipal: args.ownerPrincipal
    })
  }
})

export const setTags = mutationGeneric({
  args: {
    ipId: v.string(),
    tags: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('ips')
      .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
      .unique()

    if (!record) {
      throw new Error('IP asset not found')
    }

    await ctx.db.patch(record._id, {
      tags: args.tags
    })
  }
})
