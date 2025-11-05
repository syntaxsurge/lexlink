import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import { Ed25519KeyIdentity } from '@dfinity/identity'

import { env } from '@/lib/env'

type EscrowActor = {
  request_deposit_address?: (licenseId: string) => Promise<string>
  confirm_payment?: (licenseId: string, txid: string) => Promise<void>
  attestation?: (licenseId: string) => Promise<string>
  generate_btc_invoice?: (args: {
    sats: bigint
    memo: [] | [string]
  }) => Promise<{
    address: string
    amount_sats: bigint
    expires_at: bigint
    network: string
  }>
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
  const secretKey = deriveSecretKeyFromPem(
    // Support new path-oriented variable with backward compatibility
    (env as any).ICP_IDENTITY_PEM_PATH ?? (env as any).ICP_IDENTITY_PEM
  )
  return Ed25519KeyIdentity.fromSecretKey(secretKey)
}

const idlFactory = (idl: { IDL: typeof IDL }) => {
  const candid = idl.IDL
  return candid.Service({
    request_deposit_address: candid.Func([candid.Text], [candid.Text], []),
    confirm_payment: candid.Func([candid.Text, candid.Text], [], []),
    attestation: candid.Func([candid.Text], [candid.Text], ['query']),
    generate_btc_invoice: candid.Func(
      [
        candid.Record({
          sats: candid.Nat64,
          memo: candid.Opt(candid.Text)
        })
      ],
      [
        candid.Record({
          address: candid.Text,
          amount_sats: candid.Nat64,
          expires_at: candid.Nat64,
          network: candid.Text
        })
      ],
      []
    )
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

type DepositInvoice = {
  address: string
  amountSats?: number
  expiresAt?: number
  network?: string
}

const useMockInvoice = env.NEXT_PUBLIC_USE_MOCK_BTC_INVOICE ?? false

export async function requestDepositAddress(
  orderId: string,
  amountSats?: number
): Promise<DepositInvoice> {
  const actor = await getActor()

  const prefersGenerate =
    useMockInvoice || typeof actor.request_deposit_address !== 'function'

  if (prefersGenerate && typeof actor.generate_btc_invoice === 'function') {
    const sats = BigInt(amountSats ?? 0)
    const invoice = await actor.generate_btc_invoice({
      sats,
      memo: [orderId]
    })
    return {
      address: invoice.address,
      amountSats: Number(invoice.amount_sats),
      expiresAt: Number(invoice.expires_at),
      network: invoice.network
    }
  }

  if (typeof actor.request_deposit_address === 'function') {
    const address = await actor.request_deposit_address(orderId)
    return { address }
  }

  throw new Error('Escrow canister does not expose a deposit endpoint.')
}

export async function confirmPayment(orderId: string, txId: string) {
  const actor = await getActor()
  if (typeof actor.confirm_payment !== 'function') {
    throw new Error('Escrow canister does not expose confirm_payment')
  }
  await actor.confirm_payment(orderId, txId)
}

export async function fetchAttestation(orderId: string) {
  const actor = await getActor()
  if (typeof actor.attestation !== 'function') {
    throw new Error('Escrow canister does not expose attestation')
  }
  return actor.attestation(orderId)
}
