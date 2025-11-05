"use client"

import { Actor, type Identity } from '@dfinity/agent'

import { makeAgent } from '@/lib/ic/agent'

import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'
import minterIdl from '@/lib/ic/ckbtc/idl/minter.idl'

const HOST = process.env.NEXT_PUBLIC_ICP_CKBTC_HOST ?? 'https://icp-api.io'
const NETWORK =
  process.env.NEXT_PUBLIC_ICP_CKBTC_NETWORK === 'ckbtc-mainnet'
    ? 'ckbtc-mainnet'
    : 'ckbtc-testnet'

const CKBTC_CANISTER_DEFAULTS = {
  'ckbtc-testnet': {
    ledger: 'mc6ru-gyaaa-aaaar-qaaaq-cai',
    minter: 'ml52i-qqaaa-aaaar-qaaba-cai'
  },
  'ckbtc-mainnet': {
    ledger: 'mxzaz-hqaaa-aaaar-qaada-cai',
    minter: 'mqygn-kiaaa-aaaar-qaadq-cai'
  }
} as const

const DEPRECATED_TESTNET_LEDGER_IDS = new Set([
  'mxzaz-hqaaa-aaaar-qaada-cai'
])
const DEPRECATED_TESTNET_MINTER_IDS = new Set([
  'qjdve-lqaaa-aaaaa-aaaeq-cai'
])

const ckbtcDefaults =
  CKBTC_CANISTER_DEFAULTS[NETWORK] ??
  CKBTC_CANISTER_DEFAULTS['ckbtc-testnet']

function resolveCanisterId(
  candidate: string | undefined,
  type: 'ledger' | 'minter'
): string {
  if (candidate) {
    if (
      NETWORK === 'ckbtc-testnet' &&
      ((type === 'ledger' && DEPRECATED_TESTNET_LEDGER_IDS.has(candidate)) ||
        (type === 'minter' && DEPRECATED_TESTNET_MINTER_IDS.has(candidate)))
    ) {
      return ckbtcDefaults[type]
    }
    return candidate
  }
  return ckbtcDefaults[type]
}

const LEDGER_ID = resolveCanisterId(
  process.env.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID,
  'ledger'
)
const MINTER_ID = resolveCanisterId(
  process.env.NEXT_PUBLIC_ICP_CKBTC_MINTER_CANISTER_ID,
  'minter'
)

function invariantCanister(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(
      `Missing ${label} canister id for ckBTC. Provide NEXT_PUBLIC_ICP_CKBTC_${label.toUpperCase()}_CANISTER_ID.`
    )
  }
  return id
}

export async function ledgerActor(identity?: Identity) {
  const canisterId = invariantCanister(LEDGER_ID, 'LEDGER')
  const agent = await makeAgent(HOST, identity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Actor.createActor(ledgerIdl as any, { agent, canisterId }) as any
}

export async function minterActor(identity?: Identity) {
  const canisterId = invariantCanister(MINTER_ID, 'MINTER')
  const agent = await makeAgent(HOST, identity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Actor.createActor(minterIdl as any, { agent, canisterId }) as any
}
