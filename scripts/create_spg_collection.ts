#!/usr/bin/env -S node --enable-source-maps
/*
  Create a new SPG NFT collection on Story Aeneid and print the address.
  Usage:
    pnpm spg:create

  Required env:
    STORY_RPC_URL           – Aeneid RPC, e.g. https://aeneid.storyrpc.io
    STORY_PRIVATE_KEY       – 0x-prefixed 32-byte hex private key (Aeneid)

  Optional env:
    SPG_COLLECTION_NAME     – default: "LexLink Collection"
    SPG_COLLECTION_SYMBOL   – default: "LXNFT"
    SPG_COLLECTION_BASE_URI – default: ""
    SPG_COLLECTION_CONTRACT_URI – default: ""
    SPG_PUBLIC_MINTING      – "true" | "false" (default true)
    SPG_MINT_OPEN           – "true" | "false" (default true)
*/

import { StoryClient } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.trim() === '') {
    console.error(`Missing required env: ${name}`)
    process.exit(1)
  }
  return v
}

async function main() {
  const rpcUrl = requireEnv('STORY_RPC_URL')
  const pk = requireEnv('STORY_PRIVATE_KEY') as `0x${string}`

  const name = process.env.SPG_COLLECTION_NAME || 'LexLink Collection'
  const symbol = process.env.SPG_COLLECTION_SYMBOL || 'LXNFT'
  const baseURI = process.env.SPG_COLLECTION_BASE_URI || ''
  const contractURI = process.env.SPG_COLLECTION_CONTRACT_URI || ''
  const isPublicMinting = (process.env.SPG_PUBLIC_MINTING ?? 'true') === 'true'
  const mintOpen = (process.env.SPG_MINT_OPEN ?? 'true') === 'true'

  const account = privateKeyToAccount(pk)
  const client = StoryClient.newClient({
    chainId: 'aeneid',
    transport: http(rpcUrl),
    account
  })

  console.log('Creating SPG NFT collection...')
  const nft = (client as any).nftClient
  const result = await nft.createNFTCollection({
    name,
    symbol,
    baseURI,
    contractURI,
    owner: account.address,
    mintFeeRecipient: account.address,
    isPublicMinting,
    mintOpen
  })

  console.log(
    JSON.stringify(
      {
        spgNftContract: result.spgNftContract,
        txHash: result.txHash
      },
      null,
      2
    )
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
