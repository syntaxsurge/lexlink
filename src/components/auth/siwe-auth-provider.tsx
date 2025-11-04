'use client'

import { ReactNode, useMemo } from 'react'

import {
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  type AuthenticationStatus
} from '@rainbow-me/rainbowkit'
import { getCsrfToken, signIn, signOut, useSession } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount } from 'wagmi'

type Props = {
  children: ReactNode
}

export function SiweAuthProvider({ children }: Props) {
  const { address, chainId, isConnected } = useAccount()
  const { status, data: session } = useSession()

  const authenticationStatus: AuthenticationStatus = !isConnected
    ? 'unauthenticated'
    : status === 'loading'
      ? 'loading'
      : session?.address?.toLowerCase() === address?.toLowerCase()
        ? 'authenticated'
        : 'unauthenticated'

  const adapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          const csrf = await getCsrfToken()
          if (!csrf) {
            throw new Error('Unable to fetch CSRF token')
          }
          return csrf
        },
        createMessage: ({ nonce, address, chainId }) =>
          new SiweMessage({
            domain: window.location.host,
            address,
            statement: 'Sign in to LexLink',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce
          }),
        verify: async ({ message, signature }) => {
          const prepared = message.prepareMessage()
          const result = await signIn('siwe', {
            redirect: false,
            message: prepared,
            signature
          })
          return result?.ok ?? false
        },
        signOut: async () => {
          await signOut({ redirect: false, callbackUrl: '/' })
        }
      }),
    []
  )

  return (
    <RainbowKitAuthenticationProvider
      adapter={adapter}
      status={authenticationStatus}
      enabled={Boolean(address && chainId)}
    >
      {children}
    </RainbowKitAuthenticationProvider>
  )
}
