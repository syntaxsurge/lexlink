import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
export const record = mutation({
    args: {
        eventId: v.string(),
        action: v.string(),
        payload: v.string(),
        resourceId: v.optional(v.string()),
        actorAddress: v.optional(v.string()),
        actorPrincipal: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('events', {
            ...args,
            createdAt: Date.now()
        });
    }
});
export const listRecent = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit = 50 }) => {
        return await ctx.db.query('events').order('desc').take(limit);
    }
});
export const listByResource = query({
    args: { resourceId: v.string() },
    handler: async (ctx, { resourceId }) => {
        return await ctx.db
            .query('events')
            .withIndex('by_resourceId', q => q.eq('resourceId', resourceId))
            .collect();
    }
});
