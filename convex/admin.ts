import { v } from 'convex/values'

import { internalMutation, type MutationCtx } from './_generated/server'

const TABLES = [
  'ips',
  'licenses',
  'disputes',
  'trainingBatches',
  'users',
  'events'
] as const

const baseTime = Date.UTC(2025, 1, 15, 12, 0, 0)

type LicenseSeed = {
  orderId: string
  ipId: string
  buyer: string
  btcAddress: string
  amountSats: number
  network: string
  paymentMode: string
  btcTxId: string
  attestationHash: string
  constellationTx: string
  tokenOnChainId: string
  licenseTermsId: string
  status: string
  confirmations: number
  createdAt: number
  updatedAt: number
  contentHash: string
  c2paHash: string
  c2paArchive: string
  vcDocument: string
  vcHash: string
  complianceScore: number
  trainingUnits: number
  ckbtcSubaccount?: string
  ckbtcMintedSats?: number
  ckbtcBlockIndex?: number
  fundedAt?: number
  finalizedAt?: number
  ownerPrincipal: string
}

type UserSeed = {
  address?: string
  principal?: string
  role: 'operator' | 'creator' | 'viewer'
  createdAt: number
}

const ipSeeds = [
  {
    ipId: '0x91f1b472c455f0d8c1d87aac3b1bc4f0a9395712',
    title: 'Midnight Marriage',
    creatorAddress: '0x1111111111111111111111111111111111111111',
    priceSats: 250000,
    royaltyBps: 1000,
    licenseTermsId: '0x4a9e987086be5979e6292fc8da5ee05ad86accef',
    description: 'An AI-assisted house track; commercial licensing enabled.',
    imageUrl:
      'https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg',
    imageHash:
      '0xe247f9e6f95efa5e79efc8ae27fd1c33dbd8bb3bfc0152151229059215584728',
    mediaUrl: 'https://cdn1.suno.ai/dcd3076f-3aa5-400b-ba5d-87d30f27c311.mp3',
    mediaType: 'audio/mpeg',
    mediaHash:
      '0x90ae82eb1fa1fb7ad819faa0b4d104fd04d48b5852d24bb0c609be6e62861be0',
    ipMetadataUri: 'ipfs://midnight-marriage/metadata.json',
    ipMetadataHash:
      '0xab85dafb2cad2ea153182bc118c2afcf4b0c156542ab21ad03d63f660a094644',
    nftMetadataUri: 'ipfs://midnight-marriage/nft.json',
    nftMetadataHash:
      '0xc66333b08ad01dc797b975b7b1ee981178c124c36fc47211cbf9e57f4972aee1',
    createdAt: baseTime,
    commercialUse: true,
    derivativesAllowed: true,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  },
  {
    ipId: '0x4d33aeaabcad9818a5565d0bf90c1e75ad34a1be',
    title: 'Solar Echo',
    creatorAddress: '0x5f5c4e12b9d80a2746bc204f5c49287ce9ab1122',
    priceSats: 175000,
    royaltyBps: 800,
    licenseTermsId: '0x7f1dba23c6e9d84a53e210b5fd6c7089e13b42cd',
    description:
      'Generative ambient score tuned for branded livestreams and creator libraries.',
    imageUrl: 'https://images.lexlink.dev/solar-echo-cover.jpg',
    imageHash:
      '0x1d7685d0eb4ded2b7459f5883154547537f029ce1bc3377c31c7e69bdb4ab864',
    mediaUrl: 'https://audio.lexlink.dev/solar-echo-master.wav',
    mediaType: 'audio/wav',
    mediaHash:
      '0xdb06b1ab5ee3f87067c9dbb291e1bb2204d6e535d4d67ac8e7bedfc7d7da845f',
    ipMetadataUri: 'ipfs://solar-echo/metadata.json',
    ipMetadataHash:
      '0x12e2f5ef49478f3216018a9946da0410db673f79e604245c854c99615f4cef99',
    nftMetadataUri: 'ipfs://solar-echo/nft.json',
    nftMetadataHash:
      '0x773a3629cc9b425cc59f272c16f054bb79ed88758f60838b9716331e874621b7',
    createdAt: baseTime + 1000 * 60 * 60,
    commercialUse: true,
    derivativesAllowed: false,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  },
  {
    ipId: '0xa1c3b5d7e9f1a2c4e6d8f0a1b3c5d7e9f1a2c4e6',
    title: 'Neon District Visual Pack',
    creatorAddress: '0x8899aabbccddeeff00112233445566778899aabb',
    priceSats: 90000,
    royaltyBps: 500,
    licenseTermsId: '0x2be4d6f8a1c3e5f7091b2d4f6a8c0e2f4a6c8e0',
    description:
      'High-resolution visual loops with C2PA attestations for AI model augmentation.',
    imageUrl: 'https://images.lexlink.dev/neon-district-cover.png',
    imageHash:
      '0x47fc10250380d1f73c6fa11acd9f55c2ef92ebb075e15dfc5f7bc9b9304078b2',
    mediaUrl: 'https://assets.lexlink.dev/video/neon-district.webm',
    mediaType: 'video/webm',
    mediaHash:
      '0x52693f542111a1f554a7c362e2bfdec6d0119d169f1678d445b247798c9a1cc4',
    ipMetadataUri: 'ipfs://neon-district/metadata.json',
    ipMetadataHash:
      '0xd51adb14e7523284cec8d5243c742af8f9b22243cc7de5e8dd7742092fa7c09a',
    nftMetadataUri: 'ipfs://neon-district/nft.json',
    nftMetadataHash:
      '0xf9ef7b46594e96343684f27b3b4fd556623da7e5b5ebfc5fa09efc11d472dcf4',
    createdAt: baseTime - 1000 * 60 * 45,
    commercialUse: true,
    derivativesAllowed: true,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  }
] as const

const licenseSeeds: LicenseSeed[] = [
  {
    orderId: 'order_midnight_marriage',
    ipId: ipSeeds[0].ipId,
    buyer: '0x2222222222222222222222222222222222222222',
    btcAddress: 'tb1qm1dnight5jv9dq2c0p6e8k3h4z5u8s6t0l9k7s',
    amountSats: 250000,
    network: 'testnet',
    paymentMode: 'btc',
    btcTxId: '8fb16e56636e016a1e7d94e05875012e8a33f8a07e3b5a62c401eb8b1c2d3341',
    attestationHash:
      '0x6b98e5a1ce30cd7a567c3adf92b1e6a5cabff3a3d817f4e8811b1e241c6e3f52',
    constellationTx:
      '0xd5e13a2c4b9f18a78195d21f7530f8a621f0cecc3dd6b7f2b1a4e7c8d9f0a1b2',
    tokenOnChainId: '0x0001',
    licenseTermsId: ipSeeds[0].licenseTermsId,
    status: 'finalized',
    confirmations: 6,
    createdAt: baseTime + 1000 * 60 * 5,
    updatedAt: baseTime + 1000 * 60 * 50,
    fundedAt: baseTime + 1000 * 60 * 20,
    finalizedAt: baseTime + 1000 * 60 * 45,
    contentHash: 'ipfs://midnight-marriage/content.json',
    c2paHash:
      '0x1a9d5c7b8e3f4a6d5c7b8e3f4a6d5c7b8e3f4a6d5c7b8e3f4a6d5c7b8e3f4a6d',
    c2paArchive: 'https://assets.lexlink.dev/c2pa/midnight-marriage.c2pa',
    vcDocument: 'https://assets.lexlink.dev/vc/midnight-marriage.json',
    vcHash:
      '0x7b2c5d8f1e3a4b6d8f1e3a4b6d8f1e3a4b6d8f1e3a4b6d8f1e3a4b6d8f1e3a4b',
    complianceScore: 100,
    trainingUnits: 150,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  },
  {
    orderId: 'order_solar_echo_ckbtc',
    ipId: ipSeeds[1].ipId,
    buyer: '0x3333333333333333333333333333333333333333',
    btcAddress: 'tb1qs0larechoescrow4vxnq5gwnu8764nc6d9a8s4',
    amountSats: 180000,
    network: 'ckbtc-testnet',
    paymentMode: 'ckbtc',
    ckbtcSubaccount:
      '0x2b8f0e4c6a8d0f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    btcTxId: 'ckbtc:mint:0xabcdef1234567890',
    attestationHash:
      '0x28d4f6a2b5c7e9d1f3a5b7c9d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8f0',
    constellationTx:
      '0x3eaf1b5c9d7ea3f2c6b8d0e1f3a5c7d9e2b4f6a8c0e2f4a6c8e0f2a3c5e7d9f',
    tokenOnChainId: '0x0002',
    licenseTermsId: ipSeeds[1].licenseTermsId,
    status: 'funded',
    confirmations: 0,
    createdAt: baseTime + 1000 * 60 * 210,
    updatedAt: baseTime + 1000 * 60 * 240,
    fundedAt: baseTime + 1000 * 60 * 235,
    contentHash: 'ipfs://solar-echo/content.json',
    c2paHash:
      '0x5c7b8e3f4a6d7c8b9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f',
    c2paArchive: 'https://assets.lexlink.dev/c2pa/solar-echo.c2pa',
    vcDocument: 'https://assets.lexlink.dev/vc/solar-echo.json',
    vcHash:
      '0xf1e3a5c7d9b2c4e6a8f0b2d4c6e8a0c2f4e6a8b0c2d4e6f8a0b2c4d6e8f0a2b4',
    complianceScore: 62,
    trainingUnits: 40,
    ckbtcMintedSats: 180000,
    ckbtcBlockIndex: 482,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  },
  {
    orderId: 'order_neon_dusk_pending',
    ipId: ipSeeds[2].ipId,
    buyer: '0x4444444444444444444444444444444444444444',
    btcAddress: 'tb1qneondusk9p0xgr7c6w8f2n0ls5yaqplw4f8kq9e',
    amountSats: 90000,
    network: 'testnet',
    paymentMode: 'btc',
    btcTxId: '',
    attestationHash: '',
    constellationTx: '',
    tokenOnChainId: '',
    licenseTermsId: ipSeeds[2].licenseTermsId,
    status: 'pending',
    confirmations: 0,
    createdAt: baseTime + 1000 * 60 * 300,
    updatedAt: baseTime + 1000 * 60 * 300,
    contentHash: '',
    c2paHash: '',
    c2paArchive: '',
    vcDocument: '',
    vcHash: '',
    complianceScore: 0,
    trainingUnits: 0,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  }
] as const

const trainingBatchSeeds = [
  {
    batchId: 'batch_midnight_marriage_001',
    ipId: ipSeeds[0].ipId,
    units: 150,
    evidenceHash:
      '0x2f1a7b5c9d3e4f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    constellationTx:
      '0x4f92ab13cd68ef024579bce13579df02468ace13579bdf02468ace13579bdf02',
    createdAt: baseTime + 1000 * 60 * 90,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  },
  {
    batchId: 'batch_solar_echo_001',
    ipId: ipSeeds[1].ipId,
    units: 40,
    evidenceHash:
      '0x7d3e1f5a9b2c4d6e8f0a1b3c5d7e9f1a2c4e6d8f0a1b3c5d7e9f1a2c4e6d8f0',
    constellationTx:
      '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f',
    createdAt: baseTime + 1000 * 60 * 260,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  }
] as const

const disputeSeeds = [
  {
    disputeId: 'dispute_midnight_marriage_001',
    ipId: ipSeeds[0].ipId,
    targetTag: 'IMPROPER_USAGE',
    evidenceCid: 'ipfs://bafkreihdwdcej3m2vxxevidencelexlinkdemo',
    txHash: '0x5f2d7a3c9b1e4d6f8a0c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8f0a1b2',
    evidenceHash:
      '0x3b7e9d1f5a2c4e6d8f0a1b3c5d7e9f1a2c4e6d8f0a1b3c5d7e9f1a2c4e6d8f0',
    constellationTx:
      '0x6af3b1d5e7c9f1a3b5d7e9f1a3c5e7d9f1b3d5f7a9c1e3f5a7c9e1f3a5c7e9d1',
    status: 'open',
    livenessSeconds: 259200,
    bond: 0,
    createdAt: baseTime + 1000 * 60 * 180,
    ownerPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai'
  }
] as const

const userSeeds: UserSeed[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    principal: 'l72uw-4iaaa-aaaap-abcek-cai',
    role: 'operator' as const,
    createdAt: baseTime - 1000 * 60 * 120
  },
  {
    address: '0x5555555555555555555555555555555555555555',
    role: 'creator' as const,
    createdAt: baseTime - 1000 * 60 * 60 * 5
  },
  {
    principal: 'bclva-oyaaa-aaaap-abceq-cai',
    role: 'viewer' as const,
    createdAt: baseTime - 1000 * 60 * 30
  }
] as const

const eventSeeds = [
  {
    eventId: 'evt-20250215-0001',
    action: 'ip_asset.registered',
    resourceId: ipSeeds[0].ipId,
    payload: JSON.stringify({
      ipId: ipSeeds[0].ipId,
      title: ipSeeds[0].title,
      licenseTermsId: ipSeeds[0].licenseTermsId
    }),
    actorAddress: ipSeeds[0].creatorAddress,
    actorPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai',
    createdAt: baseTime + 1000 * 10
  },
  {
    eventId: 'evt-20250215-0002',
    action: 'license.order_created',
    resourceId: licenseSeeds[0].orderId,
    payload: JSON.stringify({
      orderId: licenseSeeds[0].orderId,
      ipId: licenseSeeds[0].ipId,
      btcAddress: licenseSeeds[0].btcAddress,
      amountSats: licenseSeeds[0].amountSats
    }),
    actorAddress: licenseSeeds[0].buyer,
    actorPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai',
    createdAt: baseTime + 1000 * 60 * 6
  },
  {
    eventId: 'evt-20250215-0003',
    action: 'license.sale_completed',
    resourceId: licenseSeeds[0].orderId,
    payload: JSON.stringify({
      orderId: licenseSeeds[0].orderId,
      btcTxId: licenseSeeds[0].btcTxId,
      constTx: licenseSeeds[0].constellationTx,
      tokenOnChainId: licenseSeeds[0].tokenOnChainId
    }),
    actorAddress: '0x1111111111111111111111111111111111111111',
    actorPrincipal: 'l72uw-4iaaa-aaaap-abcek-cai',
    createdAt: baseTime + 1000 * 60 * 55
  },
  {
    eventId: 'evt-20250215-0004',
    action: 'training.batch_recorded',
    resourceId: trainingBatchSeeds[0].batchId,
    payload: JSON.stringify({
      batchId: trainingBatchSeeds[0].batchId,
      ipId: trainingBatchSeeds[0].ipId,
      units: trainingBatchSeeds[0].units
    }),
    actorAddress: '0x5555555555555555555555555555555555555555',
    actorPrincipal: 'bclva-oyaaa-aaaap-abceq-cai',
    createdAt: baseTime + 1000 * 60 * 95
  }
] as const

async function dropTable(ctx: MutationCtx, table: (typeof TABLES)[number]) {
  const docs = await ctx.db.query(table).collect()
  for (const doc of docs) {
    await ctx.db.delete(doc._id)
  }
}

async function seedData(ctx: MutationCtx) {
  for (const ip of ipSeeds) {
    await ctx.db.insert('ips', { ...ip })
  }

  for (const license of licenseSeeds) {
    await ctx.db.insert('licenses', { ...license })
  }

  for (const batch of trainingBatchSeeds) {
    await ctx.db.insert('trainingBatches', { ...batch })
  }

  for (const dispute of disputeSeeds) {
    await ctx.db.insert('disputes', { ...dispute })
  }

  for (const user of userSeeds) {
    await ctx.db.insert('users', {
      role: user.role,
      createdAt: user.createdAt,
      ...(user.address ? { address: user.address } : {}),
      ...(user.principal ? { principal: user.principal } : {})
    })
  }

  for (const event of eventSeeds) {
    await ctx.db.insert('events', { ...event })
  }
}

export const reset = internalMutation({
  args: {
    confirm: v.literal('DROP_ALL')
  },
  handler: async (ctx, args) => {
    if (args.confirm !== 'DROP_ALL') {
      throw new Error('Confirmation string mismatch')
    }

    for (const table of TABLES) {
      await dropTable(ctx, table)
    }

    await seedData(ctx)
  }
})
