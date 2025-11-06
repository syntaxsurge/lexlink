'use client'

import { Actor, type Identity } from '@dfinity/agent'

import { makeAgent } from '@/lib/ic/agent'
import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'

const HOST = process.env.NEXT_PUBLIC_ICP_CKBTC_HOST ?? 'https://icp-api.io'
const NETWORK =
  process.env.NEXT_PUBLIC_ICP_CKBTC_NETWORK === 'ckbtc-mainnet'
    ? 'ckbtc-mainnet'
    : 'ckbtc-testnet'

const CKBTC_CANISTER_DEFAULTS = {
  'ckbtc-testnet': {
    ledger: 'mc6ru-gyaaa-aaaar-qaaaq-cai'
  },
  'ckbtc-mainnet': {
    ledger: 'mxzaz-hqaaa-aaaar-qaada-cai'
  }
} as const

const DEPRECATED_TESTNET_LEDGER_IDS = new Set(['mxzaz-hqaaa-aaaar-qaada-cai'])

const ckbtcDefaults =
  CKBTC_CANISTER_DEFAULTS[NETWORK] ?? CKBTC_CANISTER_DEFAULTS['ckbtc-testnet']

function resolveLedgerId(candidate: string | undefined): string {
  if (candidate) {
    if (
      NETWORK === 'ckbtc-testnet' &&
      DEPRECATED_TESTNET_LEDGER_IDS.has(candidate)
    ) {
      return ckbtcDefaults.ledger
    }
    return candidate
  }
  return ckbtcDefaults.ledger
}

const LEDGER_ID = resolveLedgerId(
  process.env.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID
)

function invariantLedger(id: string | undefined): string {
  if (!id) {
    throw new Error(
      'Missing ckBTC ledger canister id. Provide NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID.'
    )
  }
  return id
}

export async function ledgerActor(identity?: Identity) {
  const canisterId = invariantLedger(LEDGER_ID)
  const agent = await makeAgent(HOST, identity)

  return Actor.createActor(ledgerIdl as any, { agent, canisterId }) as any
}
