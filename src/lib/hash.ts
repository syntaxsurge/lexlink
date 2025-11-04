import crypto from 'node:crypto'

export function sha256Hex(data: crypto.BinaryLike) {
  return `0x${crypto.createHash('sha256').update(data).digest('hex')}` as const
}

export function bufferFromHex(hex: string) {
  return Buffer.from(hex.replace(/^0x/, ''), 'hex')
}
