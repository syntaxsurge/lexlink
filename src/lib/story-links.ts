export type StoryNetwork = 'mainnet' | 'aeneid'

export function ipExplorerBase(network: StoryNetwork) {
  return network === 'mainnet'
    ? 'https://explorer.story.foundation'
    : 'https://aeneid.explorer.story.foundation'
}

export function storyScanBase(network: StoryNetwork) {
  return network === 'mainnet'
    ? 'https://mainnet.storyscan.io'
    : 'https://aeneid.storyscan.io'
}

export function ipAssetExplorerUrl(
  ipId: string,
  network: StoryNetwork = 'aeneid'
) {
  return `${ipExplorerBase(network)}/ipa/${ipId}`
}

export function ipAccountOnBlockExplorer(
  ipId: string,
  network: StoryNetwork = 'aeneid'
) {
  return `${storyScanBase(network)}/address/${ipId}`
}

