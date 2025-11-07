import { Buffer } from 'node:buffer'

import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import { Ed25519KeyIdentity } from '@dfinity/identity'

import { env } from '@/lib/env'
type EscrowActor = {
  settle_ckbtc: (
    licenseId: string
  ) => Promise<{ minted: bigint; blockIndex: bigint; txids: string }>
  attestation: (licenseId: string) => Promise<string>
}

let cachedActor: EscrowActor | null = null
let cachedIdentity: Ed25519KeyIdentity | null = null

function decodeIdentityPem(): string {
  const encoded = env.ICP_IDENTITY_PEM_BASE64
  if (!encoded) {
    throw new Error(
      'ICP_IDENTITY_PEM_BASE64 is not configured. Run "pnpm encode:icp-identity" to sync the PEM contents.'
    )
  }
  try {
    return Buffer.from(encoded, 'base64').toString('utf8')
  } catch (error) {
    throw new Error(
      `Failed to decode ICP_IDENTITY_PEM_BASE64: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

function deriveSecretKeyFromPem(): Uint8Array {
  const pem = decodeIdentityPem()
  const lines = pem
    .trim()
    .split(/\r?\n/)
    .filter(
      line =>
        line.length > 0 &&
        !line.startsWith('-----BEGIN') &&
        !line.startsWith('-----END')
    )
  const base64 = lines.join('')
  const der = Buffer.from(base64, 'base64')
  return new Uint8Array(der.slice(-32))
}

export function loadIcpIdentity() {
  if (cachedIdentity) {
    return cachedIdentity
  }
  const secretKey = deriveSecretKeyFromPem()
  cachedIdentity = Ed25519KeyIdentity.fromSecretKey(secretKey)
  return cachedIdentity
}

const idlFactory = (idl: { IDL: typeof IDL }) => {
  const candid = idl.IDL

  const settlementRecord = candid.Record({
    minted: candid.Nat,
    blockIndex: candid.Nat,
    txids: candid.Text
  })

  return candid.Service({
    settle_ckbtc: candid.Func([candid.Text], [settlementRecord], []),
    attestation: candid.Func([candid.Text], [candid.Text], ['query'])
  })
}

async function getActor(): Promise<EscrowActor> {
  if (cachedActor) {
    return cachedActor
  }

  const agent = new HttpAgent({
    host: env.ICP_HOST,
    identity: loadIcpIdentity()
  })

  if (
    env.ICP_HOST.includes('localhost') ||
    env.ICP_HOST.includes('127.0.0.1')
  ) {
    await agent.fetchRootKey()
  }

  cachedActor = Actor.createActor<EscrowActor>(idlFactory as any, {
    agent,
    canisterId: env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID
  })

  return cachedActor
}

export type CkbtcSettlement = {
  minted: bigint
  blockIndex: bigint
  txids: string
}

export async function settleCkbtc(orderId: string): Promise<CkbtcSettlement> {
  const actor = await getActor()
  return actor.settle_ckbtc(orderId)
}

export async function fetchAttestation(orderId: string) {
  const actor = await getActor()
  return actor.attestation(orderId)
}
