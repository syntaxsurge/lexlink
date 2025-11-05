"use client"

import { Actor, type Identity } from '@dfinity/agent'

import { makeAgent } from '@/lib/ic/agent'

import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'
import minterIdl from '@/lib/ic/ckbtc/idl/minter.idl'

const HOST = process.env.NEXT_PUBLIC_ICP_CKBTC_HOST ?? 'https://icp-api.io'
const LEDGER_ID = process.env.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID
const MINTER_ID = process.env.NEXT_PUBLIC_ICP_CKBTC_MINTER_CANISTER_ID

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
