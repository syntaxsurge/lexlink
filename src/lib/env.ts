import { z } from 'zod'

const publicEnvSchema = z.object({
  NEXT_PUBLIC_AENEID_RPC: z.string().url(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  NEXT_PUBLIC_DAG_ADDRESS: z
    .string()
    .regex(
      /^DAG[0-9A-Za-z]{20,64}$/,
      'NEXT_PUBLIC_DAG_ADDRESS must be a DAG address'
    ),
  NEXT_PUBLIC_SITE_DOMAIN: z.string().min(3).default('localhost:3000'),
  NEXT_PUBLIC_STORY_NETWORK: z.enum(['aeneid', 'mainnet']).default('aeneid'),
  NEXT_PUBLIC_ICP_HOST: z.string().url().optional(),
  NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID: z.string().optional()
})

const serverEnvSchema = z.object({
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32)
    .default('dev-secret-lexlink-nextauth-0000000000000000'),
  PAYMENT_MODE: z.enum(['ckbtc', 'btc']).default('ckbtc'),
  STORY_RPC_URL: z.string().url(),
  STORY_CHAIN_ID: z.coerce.number().default(1315),
  STORY_SPG_NFT_ADDRESS: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      'STORY_SPG_NFT_ADDRESS must be a hex address'
    ),
  STORY_LICENSE_TEMPLATE_ADDRESS: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      'STORY_LICENSE_TEMPLATE_ADDRESS must be a hex address'
    ),
  STORY_PRIVATE_KEY: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      'STORY_PRIVATE_KEY must be a 32-byte hex string'
    ),
  STORY_PIL_URI: z.string().url(),
  ICP_HOST: z.string().url(),
  ICP_ESCROW_CANISTER_ID: z.string(),
  ICP_IDENTITY_PEM_PATH: z.string().min(1).default('icp/icp_identity.pem'),
  CONSTELLATION_PRIVATE_KEY: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      'CONSTELLATION_PRIVATE_KEY must be a hex string'
    ),
  // DAG addresses are Base58-like strings prefixed with "DAG"; lengths can vary by implementation.
  // Use a tolerant validator: starts with DAG and contains alphanumerics of reasonable length.
  CONSTELLATION_ADDRESS: z
    .string()
    .regex(
      /^DAG[0-9A-Za-z]{20,64}$/,
      'CONSTELLATION_ADDRESS must be a DAG address'
    ),
  CONSTELLATION_BE_URL: z.string().url(),
  CONSTELLATION_L0_URL: z.string().url(),
  CONSTELLATION_L1_URL: z.string().url(),
  CKBTC_MINTER_CANISTER_ID: z.string().optional(),
  CKBTC_LEDGER_CANISTER_ID: z.string().optional(),
  ICP_CKBTC_MINTER_CANISTER_ID: z.string().optional(),
  ICP_CKBTC_LEDGER_CANISTER_ID: z.string().optional(),
  ICP_CKBTC_NETWORK: z
    .enum(['ckbtc-mainnet', 'ckbtc-testnet'])
    .default('ckbtc-testnet')
    .optional(),
  CKBTC_MERCHANT_PRINCIPAL: z.string().optional(),
  CONVEX_URL: z.string().url(),
  CONVEX_DEPLOYMENT: z.string(),
  BTC_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  MEMPOOL_API_BASE: z.string().url().default('https://mempool.space'),
  VC_ISSUER_DID: z.string().min(4),
  VC_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'VC_PRIVATE_KEY must be a 32-byte hex string')
})

type PublicEnv = z.infer<typeof publicEnvSchema>
type ServerEnv = z.infer<typeof serverEnvSchema>

function parseEnv() {
  const publicEnv = publicEnvSchema.parse({
    NEXT_PUBLIC_AENEID_RPC: process.env.NEXT_PUBLIC_AENEID_RPC,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_DAG_ADDRESS: process.env.NEXT_PUBLIC_DAG_ADDRESS,
    NEXT_PUBLIC_SITE_DOMAIN: process.env.NEXT_PUBLIC_SITE_DOMAIN,
    NEXT_PUBLIC_STORY_NETWORK: process.env.NEXT_PUBLIC_STORY_NETWORK,
    NEXT_PUBLIC_ICP_HOST: process.env.NEXT_PUBLIC_ICP_HOST,
    NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID:
      process.env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID
  })

  const serverEnv = serverEnvSchema.parse({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    PAYMENT_MODE: process.env.PAYMENT_MODE,
    STORY_RPC_URL: process.env.STORY_RPC_URL,
    STORY_CHAIN_ID: process.env.STORY_CHAIN_ID,
    STORY_SPG_NFT_ADDRESS: process.env.STORY_SPG_NFT_ADDRESS,
    STORY_LICENSE_TEMPLATE_ADDRESS: process.env.STORY_LICENSE_TEMPLATE_ADDRESS,
    STORY_PRIVATE_KEY: process.env.STORY_PRIVATE_KEY,
    STORY_PIL_URI: process.env.STORY_PIL_URI,
    ICP_HOST: process.env.ICP_HOST ?? process.env.NEXT_PUBLIC_ICP_HOST,
    ICP_ESCROW_CANISTER_ID:
      process.env.ICP_ESCROW_CANISTER_ID ??
      process.env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID,
    ICP_IDENTITY_PEM_PATH:
      process.env.ICP_IDENTITY_PEM_PATH ?? process.env.ICP_IDENTITY_PEM,
    CONSTELLATION_PRIVATE_KEY: process.env.CONSTELLATION_PRIVATE_KEY,
    CONSTELLATION_ADDRESS: process.env.CONSTELLATION_ADDRESS,
    CONSTELLATION_BE_URL: process.env.CONSTELLATION_BE_URL,
    CONSTELLATION_L0_URL: process.env.CONSTELLATION_L0_URL,
    CONSTELLATION_L1_URL: process.env.CONSTELLATION_L1_URL,
    CKBTC_MINTER_CANISTER_ID: process.env.CKBTC_MINTER_CANISTER_ID,
    CKBTC_LEDGER_CANISTER_ID: process.env.CKBTC_LEDGER_CANISTER_ID,
    ICP_CKBTC_MINTER_CANISTER_ID: process.env.ICP_CKBTC_MINTER_CANISTER_ID,
    ICP_CKBTC_LEDGER_CANISTER_ID: process.env.ICP_CKBTC_LEDGER_CANISTER_ID,
    ICP_CKBTC_NETWORK: process.env.ICP_CKBTC_NETWORK,
    CKBTC_MERCHANT_PRINCIPAL:
      process.env.CKBTC_MERCHANT_PRINCIPAL ?? process.env.ICP_ESCROW_CANISTER_ID,
    CONVEX_URL: process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    BTC_NETWORK: process.env.BTC_NETWORK,
    MEMPOOL_API_BASE: process.env.MEMPOOL_API_BASE,
    VC_ISSUER_DID: process.env.VC_ISSUER_DID,
    VC_PRIVATE_KEY: process.env.VC_PRIVATE_KEY
  })

  return { publicEnv, serverEnv }
}

const { publicEnv, serverEnv } = parseEnv()

const resolvedCkbtcLedger =
  serverEnv.CKBTC_LEDGER_CANISTER_ID ??
  serverEnv.ICP_CKBTC_LEDGER_CANISTER_ID ??
  undefined
const resolvedCkbtcMinter =
  serverEnv.CKBTC_MINTER_CANISTER_ID ??
  serverEnv.ICP_CKBTC_MINTER_CANISTER_ID ??
  undefined
const resolvedCkbtcNetwork =
  serverEnv.ICP_CKBTC_NETWORK ?? 'ckbtc-testnet'

export const env = {
  ...publicEnv,
  ...serverEnv,
  CKBTC_LEDGER_CANISTER_ID: resolvedCkbtcLedger,
  CKBTC_MINTER_CANISTER_ID: resolvedCkbtcMinter,
  CKBTC_NETWORK: resolvedCkbtcNetwork
} satisfies PublicEnv &
  ServerEnv & {
    CKBTC_LEDGER_CANISTER_ID?: string
    CKBTC_MINTER_CANISTER_ID?: string
    CKBTC_NETWORK: 'ckbtc-mainnet' | 'ckbtc-testnet'
  }
