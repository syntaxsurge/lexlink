import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
const roleValidator = v.union(v.literal('operator'), v.literal('creator'), v.literal('viewer'));
export const getByAddress = query({
    args: { address: v.string() },
    handler: async (ctx, { address }) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_address', q => q.eq('address', address))
            .first();
        return user;
    }
});
export const getByPrincipal = query({
    args: { principal: v.string() },
    handler: async (ctx, { principal }) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_principal', q => q.eq('principal', principal))
            .first();
        return user;
    }
});
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('users').collect();
    }
});
export const upsertByAddress = mutation({
    args: {
        address: v.string(),
        defaultRole: roleValidator
    },
    handler: async (ctx, { address, defaultRole }) => {
        const existing = await ctx.db
            .query('users')
            .withIndex('by_address', q => q.eq('address', address))
            .first();
        if (existing) {
            return {
                id: existing._id,
                role: existing.role,
                address: existing.address,
                principal: existing.principal
            };
        }
        const id = await ctx.db.insert('users', {
            address,
            role: defaultRole,
            createdAt: Date.now()
        });
        return {
            id,
            role: defaultRole,
            address,
            principal: undefined
        };
    }
});
export const upsertByPrincipal = mutation({
    args: {
        principal: v.string(),
        defaultRole: roleValidator
    },
    handler: async (ctx, { principal, defaultRole }) => {
        const existing = await ctx.db
            .query('users')
            .withIndex('by_principal', q => q.eq('principal', principal))
            .first();
        if (existing) {
            return {
                id: existing._id,
                role: existing.role,
                address: existing.address,
                principal: existing.principal
            };
        }
        const id = await ctx.db.insert('users', {
            principal,
            role: defaultRole,
            createdAt: Date.now()
        });
        return {
            id,
            role: defaultRole,
            address: undefined,
            principal
        };
    }
});
export const setRole = mutation({
    args: {
        userId: v.id('users'),
        role: roleValidator
    },
    handler: async (ctx, { userId, role }) => {
        await ctx.db.patch(userId, { role });
    }
});
