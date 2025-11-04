'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { useState } from 'react'

import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig
} from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig, http } from 'wagmi'

import { storyAeneid } from '@/lib/chains'

const chains = [storyAeneid] as const

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ??
  (() => {
    throw new Error(
      'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is required for wallet connections'
    )
  })()

const config = getDefaultConfig({
  appName: 'LexLink',
  projectId: walletConnectProjectId,
  chains,
  ssr: true,
  transports: {
    [storyAeneid.id]: http(storyAeneid.rpcUrls.default.http[0])
  }
})

type ProvidersProps = {
  children: React.ReactNode
}

export function AppProviders({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            borderRadius: 'medium'
          })}
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}
