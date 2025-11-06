export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://apac.orbitor.dev/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://nftstorage.link/ipfs/'
] as const

export function expandIpfsUri(uri: string): string[] {
  if (!uri.startsWith('ipfs://')) {
    return [uri]
  }
  const cidPath = uri.replace('ipfs://', '')
  return IPFS_GATEWAYS.map(gateway => `${gateway}${cidPath}`)
}
