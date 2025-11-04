import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
export const list = queryGeneric({
    args: {},
    handler: async (ctx) => {
        const licenses = await ctx.db.query('licenses').collect();
        return licenses.sort((a, b) => b.createdAt - a.createdAt);
    }
});
export const listByIp = queryGeneric({
    args: { ipId: v.string() },
    handler: async (ctx, args) => {
        const licenses = await ctx.db
            .query('licenses')
            .withIndex('by_ipId', q => q.eq('ipId', args.ipId))
            .collect();
        return licenses.sort((a, b) => b.createdAt - a.createdAt);
    }
});
export const get = queryGeneric({
    args: { orderId: v.string() },
    handler: async (ctx, args) => {
        return ctx.db
            .query('licenses')
            .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
            .unique();
    }
});
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
            contentHash: '',
            c2paHash: '',
            c2paArchive: '',
            vcDocument: '',
            vcHash: '',
            complianceScore: 0,
            trainingUnits: 0,
            status: 'awaiting_payment',
            createdAt: Date.now()
        });
    }
});
export const markCompleted = mutationGeneric({
    args: {
        orderId: v.string(),
        btcTxId: v.string(),
        attestationHash: v.string(),
        constellationTx: v.string(),
        tokenOnChainId: v.string(),
        contentHash: v.string(),
        c2paHash: v.string(),
        c2paArchive: v.string(),
        vcDocument: v.string(),
        vcHash: v.string(),
        complianceScore: v.number()
    },
    handler: async (ctx, args) => {
        const license = await ctx.db
            .query('licenses')
            .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
            .unique();
        if (!license) {
            throw new Error('License order not found');
        }
        await ctx.db.patch(license._id, {
            btcTxId: args.btcTxId,
            attestationHash: args.attestationHash,
            constellationTx: args.constellationTx,
            tokenOnChainId: args.tokenOnChainId,
            contentHash: args.contentHash,
            c2paHash: args.c2paHash,
            c2paArchive: args.c2paArchive,
            vcDocument: args.vcDocument,
            vcHash: args.vcHash,
            complianceScore: args.complianceScore,
            status: 'completed'
        });
    }
});
export const setTrainingMetrics = mutationGeneric({
    args: {
        orderId: v.string(),
        trainingUnits: v.number(),
        complianceScore: v.number()
    },
    handler: async (ctx, args) => {
        const license = await ctx.db
            .query('licenses')
            .withIndex('by_orderId', q => q.eq('orderId', args.orderId))
            .unique();
        if (!license) {
            throw new Error('License order not found');
        }
        await ctx.db.patch(license._id, {
            trainingUnits: args.trainingUnits,
            complianceScore: args.complianceScore
        });
    }
});
