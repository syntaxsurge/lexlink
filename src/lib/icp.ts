import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import { Ed25519KeyIdentity } from '@dfinity/identity'

import { env } from '@/lib/env'

type EscrowActor = {
  request_deposit_address: (licenseId: string) => Promise<string>
  confirm_payment: (licenseId: string, txid: string) => Promise<void>
  attestation: (licenseId: string) => Promise<string>
}

let cachedActor: EscrowActor | null = null

function loadPemContent(pemOrPath: string): string {
  const raw = pemOrPath.trim()
  // If it looks like inline PEM content, return as-is
  if (raw.includes('BEGIN') && raw.includes('PRIVATE KEY')) return raw
  // Otherwise, treat as a filesystem path (relative or absolute)
  const resolved = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw)
  return fs.readFileSync(resolved, 'utf8')
}

function deriveSecretKeyFromPem(pemOrPath: string): Uint8Array {
  const pem = loadPemContent(pemOrPath)
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

function getIdentity() {
  const secretKey = deriveSecretKeyFromPem(env.ICP_IDENTITY_PEM)
  return Ed25519KeyIdentity.fromSecretKey(secretKey)
}

const idlFactory = (idl: { IDL: typeof IDL }) => {
  const candid = idl.IDL
  return candid.Service({
    request_deposit_address: candid.Func([candid.Text], [candid.Text], []),
    confirm_payment: candid.Func([candid.Text, candid.Text], [], []),
    attestation: candid.Func([candid.Text], [candid.Text], ['query'])
  })
}

async function getActor(): Promise<EscrowActor> {
  if (cachedActor) {
    return cachedActor
  }

  const agent = new HttpAgent({
    host: env.ICP_HOST,
    identity: getIdentity()
  })

  if (
    env.ICP_HOST.includes('localhost') ||
    env.ICP_HOST.includes('127.0.0.1')
  ) {
    await agent.fetchRootKey()
  }

  cachedActor = Actor.createActor<EscrowActor>(idlFactory as any, {
    agent,
    canisterId: env.ICP_ESCROW_CANISTER_ID
  })

  return cachedActor
}

export async function requestDepositAddress(orderId: string) {
  const actor = await getActor()
  return actor.request_deposit_address(orderId)
}

export async function confirmPayment(orderId: string, txId: string) {
  const actor = await getActor()
  await actor.confirm_payment(orderId, txId)
}

export async function fetchAttestation(orderId: string) {
  const actor = await getActor()
  return actor.attestation(orderId)
}
