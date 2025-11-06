import { z } from 'zod'

const CKBTC_CANISTER_DEFAULTS = {
  'ckbtc-testnet': {
    ledger: 'mc6ru-gyaaa-aaaar-qaaaq-cai'
  },
  'ckbtc-mainnet': {
    ledger: 'mxzaz-hqaaa-aaaar-qaada-cai'
  }
} satisfies Record<'ckbtc-mainnet' | 'ckbtc-testnet', { ledger: string }>

const DEPRECATED_TESTNET_LEDGER_IDS = new Set(['mxzaz-hqaaa-aaaar-qaada-cai'])

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
  NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID: z.string().optional(),
  NEXT_PUBLIC_ICP_CKBTC_HOST: z.string().url().optional(),
  NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID: z.string().optional(),
  NEXT_PUBLIC_ICP_CKBTC_NETWORK: z
    .enum(['ckbtc-mainnet', 'ckbtc-testnet'])
    .optional(),
  NEXT_PUBLIC_CONSTELLATION_METAGRAPH_L0_URL: z.string().url().optional()
})

const serverEnvSchema = z.object({
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32)
    .default('dev-secret-lexlink-nextauth-0000000000000000'),
  NEXTAUTH_DEBUG: z
    .enum(['true', 'false'])
    .default('false')
    .transform(value => value === 'true'),
  PAYMENT_MODE: z.enum(['ckbtc', 'btc']).default('ckbtc'),
  STORY_RPC_URL: z.string().url(),
  STORY_CHAIN_ID: z.coerce.number().default(1315),
  STORY_SPG_NFT_ADDRESS: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      'STORY_SPG_NFT_ADDRESS must be a hex address'
    ),
  STORY_LICENSE_TOKEN_ADDRESS: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      'STORY_LICENSE_TOKEN_ADDRESS must be a hex address'
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
  CONSTELLATION_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform(value => value === 'true'),
  CONSTELLATION_PRIVATE_KEY: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      'CONSTELLATION_PRIVATE_KEY must be a hex string'
    ),
  CONSTELLATION_BE_URL: z.string().url().optional(),
  CONSTELLATION_L0_URL: z.string().url().optional(),
  CONSTELLATION_L1_URL: z.string().url().optional(),
  CONSTELLATION_TX_AMOUNT_DAG: z.coerce.number().positive().optional(),
  CONSTELLATION_MEMO_MAX: z.coerce.number().int().positive().optional(),
  // DAG addresses are Base58-like strings prefixed with "DAG"; lengths can vary by implementation.
  // Use a tolerant validator: starts with DAG and contains alphanumerics of reasonable length.
  CONSTELLATION_ADDRESS: z
    .string()
    .regex(
      /^DAG[0-9A-Za-z]{20,64}$/,
      'CONSTELLATION_ADDRESS must be a DAG address'
    ),
  CONSTELLATION_SINK_ADDRESS: z
    .string()
    .regex(
      /^DAG[0-9A-Za-z]{20,64}$/,
      'CONSTELLATION_SINK_ADDRESS must be a DAG address'
    ),
  CONSTELLATION_NETWORK: z
    .enum(['integrationnet', 'testnet', 'mainnet'])
    .default('integrationnet'),
  PINATA_JWT: z.string().min(10).optional(),
  PINATA_GATEWAY: z.string().url().default('https://gateway.pinata.cloud'),
  PINATA_API_URL: z.string().url().default('https://api.pinata.cloud'),
  CKBTC_LEDGER_CANISTER_ID: z.string().optional(),
  ICP_CKBTC_HOST: z.string().url().optional(),
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
    .regex(/^0x[0-9a-fA-F]{64}$/, 'VC_PRIVATE_KEY must be a 32-byte hex string'),
  CONSTELLATION_METAGRAPH_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform(value => value === 'true'),
  CONSTELLATION_METAGRAPH_DATA_L1_URL: z.string().url().optional(),
  CONSTELLATION_METAGRAPH_L0_URL: z.string().url().optional(),
  CONSTELLATION_METAGRAPH_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'CONSTELLATION_METAGRAPH_PRIVATE_KEY must be hex')
    .optional(),
  OPENAI_API_KEY: z.string().min(10),
  OPENAI_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1'),
  OPENAI_IMAGE_SIZE: z.string().default('1024x1024'),
  OPENAI_IMAGE_QUALITY: z.enum(['standard', 'hd']).default('standard'),
  DEEPSEEK_API_KEY: z.string().min(10).optional(),
  AI_CREATOR_NAME: z
    .string()
    .min(2)
    .default('LexLink AI Studio'),
  AI_CREATOR_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'AI_CREATOR_ADDRESS must be a hex address'),
  AI_CREATOR_DESCRIPTION: z
    .string()
    .min(2)
    .default('Autonomous LexLink agent orchestrating AI asset creation.'),
  AI_CREATOR_SOCIAL_URL: z.string().url().optional(),
  AI_CREATOR_SOCIAL_PLATFORM: z.string().min(2).default('Website')
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
      process.env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID,
    NEXT_PUBLIC_ICP_CKBTC_HOST: process.env.NEXT_PUBLIC_ICP_CKBTC_HOST,
    NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID:
      process.env.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID,
    NEXT_PUBLIC_ICP_CKBTC_NETWORK: process.env.NEXT_PUBLIC_ICP_CKBTC_NETWORK,
    NEXT_PUBLIC_CONSTELLATION_METAGRAPH_L0_URL:
      process.env.NEXT_PUBLIC_CONSTELLATION_METAGRAPH_L0_URL
  })

  const serverEnv = serverEnvSchema.parse({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
    PAYMENT_MODE: process.env.PAYMENT_MODE,
    STORY_RPC_URL: process.env.STORY_RPC_URL,
    STORY_CHAIN_ID: process.env.STORY_CHAIN_ID,
    STORY_SPG_NFT_ADDRESS: process.env.STORY_SPG_NFT_ADDRESS,
    STORY_LICENSE_TOKEN_ADDRESS: process.env.STORY_LICENSE_TOKEN_ADDRESS,
    STORY_LICENSE_TEMPLATE_ADDRESS: process.env.STORY_LICENSE_TEMPLATE_ADDRESS,
    STORY_PRIVATE_KEY: process.env.STORY_PRIVATE_KEY,
    STORY_PIL_URI: process.env.STORY_PIL_URI,
    ICP_HOST: process.env.ICP_HOST ?? process.env.NEXT_PUBLIC_ICP_HOST,
    ICP_ESCROW_CANISTER_ID:
      process.env.ICP_ESCROW_CANISTER_ID ??
      process.env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID,
    ICP_IDENTITY_PEM_PATH:
      process.env.ICP_IDENTITY_PEM_PATH ?? process.env.ICP_IDENTITY_PEM,
    CONSTELLATION_ENABLED: process.env.CONSTELLATION_ENABLED,
    CONSTELLATION_PRIVATE_KEY: process.env.CONSTELLATION_PRIVATE_KEY,
    CONSTELLATION_ADDRESS: process.env.CONSTELLATION_ADDRESS,
    CONSTELLATION_SINK_ADDRESS: process.env.CONSTELLATION_SINK_ADDRESS,
    CONSTELLATION_NETWORK: process.env.CONSTELLATION_NETWORK,
    CONSTELLATION_BE_URL: process.env.CONSTELLATION_BE_URL,
    CONSTELLATION_L0_URL: process.env.CONSTELLATION_L0_URL,
    CONSTELLATION_L1_URL: process.env.CONSTELLATION_L1_URL,
    CONSTELLATION_TX_AMOUNT_DAG: process.env.CONSTELLATION_TX_AMOUNT_DAG,
    CONSTELLATION_MEMO_MAX: process.env.CONSTELLATION_MEMO_MAX,
    PINATA_JWT: process.env.PINATA_JWT,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    PINATA_API_URL: process.env.PINATA_API_URL,
    CKBTC_LEDGER_CANISTER_ID: process.env.CKBTC_LEDGER_CANISTER_ID,
    ICP_CKBTC_HOST: process.env.ICP_CKBTC_HOST,
    ICP_CKBTC_LEDGER_CANISTER_ID: process.env.ICP_CKBTC_LEDGER_CANISTER_ID,
    ICP_CKBTC_NETWORK: process.env.ICP_CKBTC_NETWORK,
    CKBTC_MERCHANT_PRINCIPAL:
      process.env.CKBTC_MERCHANT_PRINCIPAL ??
      process.env.ICP_ESCROW_CANISTER_ID,
    CONVEX_URL: process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    BTC_NETWORK: process.env.BTC_NETWORK,
    MEMPOOL_API_BASE: process.env.MEMPOOL_API_BASE,
    VC_ISSUER_DID: process.env.VC_ISSUER_DID,
    VC_PRIVATE_KEY: process.env.VC_PRIVATE_KEY,
    CONSTELLATION_METAGRAPH_ENABLED: process.env.CONSTELLATION_METAGRAPH_ENABLED,
    CONSTELLATION_METAGRAPH_DATA_L1_URL:
      process.env.CONSTELLATION_METAGRAPH_DATA_L1_URL,
    CONSTELLATION_METAGRAPH_L0_URL: process.env.CONSTELLATION_METAGRAPH_L0_URL,
    CONSTELLATION_METAGRAPH_PRIVATE_KEY:
      process.env.CONSTELLATION_METAGRAPH_PRIVATE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_API_BASE: process.env.OPENAI_API_BASE,
    OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
    OPENAI_IMAGE_SIZE: process.env.OPENAI_IMAGE_SIZE,
    OPENAI_IMAGE_QUALITY: process.env.OPENAI_IMAGE_QUALITY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    AI_CREATOR_NAME: process.env.AI_CREATOR_NAME,
    AI_CREATOR_ADDRESS: process.env.AI_CREATOR_ADDRESS,
    AI_CREATOR_DESCRIPTION: process.env.AI_CREATOR_DESCRIPTION,
    AI_CREATOR_SOCIAL_URL: process.env.AI_CREATOR_SOCIAL_URL,
    AI_CREATOR_SOCIAL_PLATFORM: process.env.AI_CREATOR_SOCIAL_PLATFORM
  })

  return { publicEnv, serverEnv }
}

const { publicEnv, serverEnv } = parseEnv()

const resolvedCkbtcLedger =
  serverEnv.CKBTC_LEDGER_CANISTER_ID ??
  serverEnv.ICP_CKBTC_LEDGER_CANISTER_ID ??
  publicEnv.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID ??
  undefined
const resolvedCkbtcNetwork =
  serverEnv.ICP_CKBTC_NETWORK ??
  publicEnv.NEXT_PUBLIC_ICP_CKBTC_NETWORK ??
  'ckbtc-testnet'
const resolvedCkbtcHost =
  serverEnv.ICP_CKBTC_HOST ??
  publicEnv.NEXT_PUBLIC_ICP_CKBTC_HOST ??
  'https://icp-api.io'

const ckbtcDefaults = CKBTC_CANISTER_DEFAULTS[resolvedCkbtcNetwork]

function sanitizeLedgerId(id: string | undefined): string | undefined {
  if (!id) {
    return undefined
  }
  if (resolvedCkbtcNetwork === 'ckbtc-testnet') {
    if (DEPRECATED_TESTNET_LEDGER_IDS.has(id)) {
      console.warn(
        `[env] Ignoring deprecated ckBTC testnet ledger canister id ${id}; substituting ${ckbtcDefaults.ledger}.`
      )
      return undefined
    }
  }
  return id
}

const sanitizedLedgerId = sanitizeLedgerId(resolvedCkbtcLedger)

const ckbtcLedgerId = sanitizedLedgerId ?? ckbtcDefaults.ledger

const CONSTELLATION_DEFAULTS = {
  integrationnet: {
    beUrl: 'https://be-integrationnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-integrationnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-integrationnet.constellationnetwork.io'
  },
  testnet: {
    beUrl: 'https://be-testnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-testnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-testnet.constellationnetwork.io'
  },
  mainnet: {
    beUrl: 'https://be-mainnet.constellationnetwork.io',
    l0Url: 'https://l0-lb-mainnet.constellationnetwork.io',
    l1Url: 'https://l1-lb-mainnet.constellationnetwork.io'
  }
} as const

const constellationDefaults =
  CONSTELLATION_DEFAULTS[serverEnv.CONSTELLATION_NETWORK]

const resolvedConstellationBeUrl =
  serverEnv.CONSTELLATION_BE_URL ?? constellationDefaults.beUrl
const resolvedConstellationL0Url =
  serverEnv.CONSTELLATION_L0_URL ?? constellationDefaults.l0Url
const resolvedConstellationL1Url =
  serverEnv.CONSTELLATION_L1_URL ?? constellationDefaults.l1Url
const resolvedConstellationMemoMax =
  serverEnv.CONSTELLATION_MEMO_MAX ?? 512
const resolvedConstellationTxAmount =
  serverEnv.CONSTELLATION_TX_AMOUNT_DAG ?? undefined

const openAiBase = serverEnv.OPENAI_API_BASE.replace(/\/$/, '')

export const env = {
  ...publicEnv,
  ...serverEnv,
  OPENAI_API_BASE: openAiBase,
  NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID:
    publicEnv.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID ?? ckbtcLedgerId,
  CKBTC_LEDGER_CANISTER_ID: ckbtcLedgerId,
  CKBTC_NETWORK: resolvedCkbtcNetwork,
  CKBTC_HOST: resolvedCkbtcHost,
  CONSTELLATION_BE_URL: resolvedConstellationBeUrl,
  CONSTELLATION_L0_URL: resolvedConstellationL0Url,
  CONSTELLATION_L1_URL: resolvedConstellationL1Url,
  CONSTELLATION_MEMO_MAX: resolvedConstellationMemoMax,
  CONSTELLATION_TX_AMOUNT_DAG: resolvedConstellationTxAmount
} satisfies PublicEnv &
  ServerEnv & {
    CKBTC_LEDGER_CANISTER_ID?: string
    CKBTC_NETWORK: 'ckbtc-mainnet' | 'ckbtc-testnet'
    CKBTC_HOST: string
    CONSTELLATION_BE_URL: string
    CONSTELLATION_L0_URL: string
    CONSTELLATION_L1_URL: string
    CONSTELLATION_MEMO_MAX: number
    CONSTELLATION_TX_AMOUNT_DAG?: number
  }
