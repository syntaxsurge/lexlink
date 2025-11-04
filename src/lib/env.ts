import { z } from 'zod'

const publicEnvSchema = z.object({
  NEXT_PUBLIC_AENEID_RPC: z.string().url(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional()
})

const serverEnvSchema = z.object({
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
    .regex(/^DAG[0-9A-Za-z]{20,64}$/, 'CONSTELLATION_ADDRESS must be a DAG address'),
  CONSTELLATION_BE_URL: z.string().url(),
  CONSTELLATION_L0_URL: z.string().url(),
  CONSTELLATION_L1_URL: z.string().url(),
  CONVEX_URL: z.string().url(),
  CONVEX_DEPLOYMENT: z.string(),
  BTC_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet')
})

type PublicEnv = z.infer<typeof publicEnvSchema>
type ServerEnv = z.infer<typeof serverEnvSchema>

function parseEnv() {
  const publicEnv = publicEnvSchema.parse({
    NEXT_PUBLIC_AENEID_RPC: process.env.NEXT_PUBLIC_AENEID_RPC,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL
  })

  const serverEnv = serverEnvSchema.parse({
    STORY_RPC_URL: process.env.STORY_RPC_URL,
    STORY_CHAIN_ID: process.env.STORY_CHAIN_ID,
    STORY_SPG_NFT_ADDRESS: process.env.STORY_SPG_NFT_ADDRESS,
    STORY_LICENSE_TEMPLATE_ADDRESS: process.env.STORY_LICENSE_TEMPLATE_ADDRESS,
    STORY_PRIVATE_KEY: process.env.STORY_PRIVATE_KEY,
    STORY_PIL_URI: process.env.STORY_PIL_URI,
    ICP_HOST: process.env.ICP_HOST,
    ICP_ESCROW_CANISTER_ID: process.env.ICP_ESCROW_CANISTER_ID,
    ICP_IDENTITY_PEM_PATH: process.env.ICP_IDENTITY_PEM_PATH ?? process.env.ICP_IDENTITY_PEM,
    CONSTELLATION_PRIVATE_KEY: process.env.CONSTELLATION_PRIVATE_KEY,
    CONSTELLATION_ADDRESS: process.env.CONSTELLATION_ADDRESS,
    CONSTELLATION_BE_URL: process.env.CONSTELLATION_BE_URL,
    CONSTELLATION_L0_URL: process.env.CONSTELLATION_L0_URL,
    CONSTELLATION_L1_URL: process.env.CONSTELLATION_L1_URL,
    CONVEX_URL: process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    BTC_NETWORK: process.env.BTC_NETWORK
  })

  return { publicEnv, serverEnv }
}

const { publicEnv, serverEnv } = parseEnv()

export const env = {
  ...publicEnv,
  ...serverEnv
} satisfies PublicEnv & ServerEnv
