import { Principal } from '@dfinity/principal'

export type LedgerAccount = {
  owner: Principal
  subaccount: [] | [number[]]
}

export function toLedgerAccount(owner: Principal, sub?: Uint8Array): LedgerAccount {
  return {
    owner,
    subaccount: sub ? [Array.from(sub)] : []
  }
}

export function formatTokenAmount(value: bigint, decimals: number) {
  if (decimals < 0) {
    throw new Error('Token decimals cannot be negative')
  }
  const base = BigInt(10) ** BigInt(decimals)
  const whole = value / base
  const fraction = value % base
  if (fraction === 0n) {
    return whole.toString()
  }
  const padded = fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole.toString()}.${padded}`
}

export function hexToUint8Array(hex: string) {
  const normalized = hex.trim().toLowerCase()
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('Expected even-length hex string')
  }
  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16)
  }
  return bytes
}
