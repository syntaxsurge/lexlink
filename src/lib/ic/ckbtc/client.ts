import { Actor, type Identity } from '@dfinity/agent'

import { env } from '@/lib/env'
import { makeAgent } from '@/lib/ic/agent'

import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'
import minterIdl from '@/lib/ic/ckbtc/idl/minter.idl'

function requireCanisterId(label: 'ledger' | 'minter'): string {
  const value =
    label === 'ledger'
      ? env.CKBTC_LEDGER_CANISTER_ID
      : env.CKBTC_MINTER_CANISTER_ID
  if (!value) {
    throw new Error(
      `Missing ${label} canister id for ckBTC. Ensure environment variables are set.`
    )
  }
  return value
}

export async function ledgerActor(identity?: Identity) {
  const canisterId = requireCanisterId('ledger')
  const agent = await makeAgent(identity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Actor.createActor(ledgerIdl as any, { agent, canisterId }) as any
}

export async function minterActor(identity?: Identity) {
  const canisterId = requireCanisterId('minter')
  const agent = await makeAgent(identity)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Actor.createActor(minterIdl as any, { agent, canisterId }) as any
}
