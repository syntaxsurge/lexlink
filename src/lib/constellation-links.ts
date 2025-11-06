export type ConstellationNetworkId =
  | 'integrationnet'
  | 'testnet'
  | 'mainnet'

const NETWORK_LINKS: Record<
  ConstellationNetworkId,
  { explorer: string; api: string }
> = {
  integrationnet: {
    explorer: 'https://integrationnet.constellationnetwork.io',
    api: 'https://be-integrationnet.constellationnetwork.io'
  },
  testnet: {
    explorer: 'https://testnet.constellationnetwork.io',
    api: 'https://be-testnet.constellationnetwork.io'
  },
  mainnet: {
    explorer: 'https://explorer.constellationnetwork.io',
    api: 'https://be-mainnet.constellationnetwork.io'
  }
}

function resolveNetworkLinks(network: ConstellationNetworkId) {
  return NETWORK_LINKS[network] ?? NETWORK_LINKS.integrationnet
}

export function constellationExplorerUrl(
  network: ConstellationNetworkId,
  txHash: string
) {
  const { explorer } = resolveNetworkLinks(network)
  return `${explorer.replace(/\/$/, '')}/transaction/${txHash}`
}

export function constellationTransactionApiUrl(
  network: ConstellationNetworkId,
  txHash: string
) {
  const { api } = resolveNetworkLinks(network)
  return `${api.replace(/\/$/, '')}/transactions/${txHash}`
}
