import { defineChain } from 'viem'

export const storyAeneid = defineChain({
  id: 1315,
  name: 'Story Aeneid',
  nativeCurrency: {
    name: 'Story Testnet Token',
    symbol: 'WIP',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc.aeneid.storyprotocol.net'] },
    public: { http: ['https://rpc.aeneid.storyprotocol.net'] }
  },
  blockExplorers: {
    default: {
      name: 'StoryScan',
      url: 'https://aeneid.storyscan.io'
    }
  }
})
