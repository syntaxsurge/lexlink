'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

import type { Identity } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'
import { useSession } from 'next-auth/react'

import {
  SESSION_TTL_NS,
  resolveDerivationOrigin,
  resolveIdentityProvider
} from '@/lib/internet-identity'

type InternetIdentityContextValue = {
  ready: boolean
  principal: Principal | null
  authClient: AuthClient | null
  isAuthenticating: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
  getIdentity: () => Identity | null
}

const InternetIdentityContext =
  createContext<InternetIdentityContextValue | null>(null)

async function hydratePrincipal(client: AuthClient) {
  const isAuthenticated = await client.isAuthenticated()
  if (!isAuthenticated) {
    return null
  }
  const identity = client.getIdentity()
  const principal = identity.getPrincipal()
  return principal.isAnonymous() ? null : principal
}

export function InternetIdentityProvider({
  children
}: {
  children: ReactNode
}) {
  const { status } = useSession()
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [principal, setPrincipal] = useState<Principal | null>(null)
  const [ready, setReady] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    let cancelled = false
    AuthClient.create().then(async client => {
      if (cancelled) return
      setAuthClient(client)
      const hydrated = await hydratePrincipal(client)
      if (!cancelled) {
        setPrincipal(hydrated)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authClient) {
      return
    }
    let cancelled = false
    const synchronizePrincipal = async () => {
      try {
        const hydrated = await hydratePrincipal(authClient)
        if (!cancelled) {
          setPrincipal(hydrated)
        }
      } catch {
        if (!cancelled) {
          setPrincipal(null)
        }
      }
    }
    void synchronizePrincipal()
    return () => {
      cancelled = true
    }
  }, [authClient, status])

  const refresh = useCallback(async () => {
    if (!authClient) return
    const hydrated = await hydratePrincipal(authClient)
    setPrincipal(hydrated)
  }, [authClient])

  const connect = useCallback(async () => {
    if (!authClient) {
      throw new Error('Internet Identity client not ready.')
    }
    const identity = authClient.getIdentity()
    if (!identity.getPrincipal().isAnonymous()) {
      setPrincipal(identity.getPrincipal())
      return
    }

    setIsAuthenticating(true)
    try {
      const identityProvider = resolveIdentityProvider()
      const derivationOrigin = resolveDerivationOrigin()
      await new Promise<void>((resolve, reject) => {
        authClient
          .login({
            identityProvider,
            maxTimeToLive: SESSION_TTL_NS,
            ...(derivationOrigin ? { derivationOrigin } : {}),
            onSuccess: resolve,
            onError: reject
          })
          .catch(reject)
      })
      const hydrated = await hydratePrincipal(authClient)
      if (!hydrated) {
        throw new Error('Internet Identity authentication cancelled.')
      }
      setPrincipal(hydrated)
    } finally {
      setIsAuthenticating(false)
    }
  }, [authClient])

  const disconnect = useCallback(async () => {
    if (!authClient) return
    await authClient.logout().catch(() => {})
    setPrincipal(null)
  }, [authClient])

  const getIdentity = useCallback((): Identity | null => {
    if (!authClient) return null
    const identity = authClient.getIdentity()
    return identity.getPrincipal().isAnonymous() ? null : (identity as Identity)
  }, [authClient])

  const value = useMemo(
    () => ({
      ready,
      principal,
      authClient,
      isAuthenticating,
      connect,
      disconnect,
      refresh,
      getIdentity
    }),
    [
      ready,
      principal,
      authClient,
      isAuthenticating,
      connect,
      disconnect,
      refresh,
      getIdentity
    ]
  )

  return (
    <InternetIdentityContext.Provider value={value}>
      {children}
    </InternetIdentityContext.Provider>
  )
}

export function useInternetIdentity() {
  const context = useContext(InternetIdentityContext)
  if (!context) {
    throw new Error(
      'useInternetIdentity must be used within an InternetIdentityProvider'
    )
  }
  return context
}
