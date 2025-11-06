import { Actor, type Identity } from '@dfinity/agent'

import { env } from '@/lib/env'
import { makeAgent } from '@/lib/ic/agent'
import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'

function requireLedgerCanisterId(): string {
  const value = env.CKBTC_LEDGER_CANISTER_ID
  if (!value) {
    throw new Error(
      'Missing ckBTC ledger canister id. Ensure environment variables are set.'
    )
  }
  return value
}

function resolveHost(): string {
  return env.CKBTC_HOST ?? 'https://icp-api.io'
}

export async function ledgerActor(identity?: Identity) {
  const canisterId = requireLedgerCanisterId()
  const agent = await makeAgent(resolveHost(), identity)

  return Actor.createActor(ledgerIdl as any, { agent, canisterId }) as any
}
