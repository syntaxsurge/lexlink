import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'

/**
 * Derive a deterministic 32-byte subaccount for a given order identifier.
 * Mirrors the Motoko escrow canister logic (SHA-256 over UTF-8 bytes).
 */
export function deriveOrderSubaccount(orderId: string): Uint8Array {
  return crypto
    .createHash('sha256')
    .update(Buffer.from(orderId, 'utf8'))
    .digest()
}

export function formatSubaccountHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

export function parseSubaccountHex(hex: string): Uint8Array {
  const sanitized = hex.trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(sanitized)) {
    throw new Error('Expected a 64-character hex-encoded subaccount')
  }
  return new Uint8Array(Buffer.from(sanitized, 'hex'))
}
