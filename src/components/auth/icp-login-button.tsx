'use client'

import { useState } from 'react'

import { AuthClient } from '@dfinity/auth-client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const SESSION_TTL_NS = 7n * 24n * 60n * 60n * 1_000_000_000n

function isBrowser() {
  return typeof window !== 'undefined'
}

function isHostedOnMainnet() {
  if (!isBrowser()) return false
  const hostname = window.location.hostname
  return (
    hostname.includes('.ic0.app') ||
    hostname.includes('.icp0.io') ||
    hostname.includes('.raw.icp0.io')
  )
}

function getFrontendCanisterId() {
  return (
    process.env.NEXT_PUBLIC_CANISTER_ID_FRONTEND ??
    process.env.CANISTER_ID_FRONTEND ??
    ''
  )
}

function getDerivationOrigin() {
  if (!isHostedOnMainnet()) return undefined
  const canisterId = getFrontendCanisterId()
  if (!canisterId) return undefined
  return `https://${canisterId}.icp0.io`
}

function getIdentityProvider() {
  const override = process.env.NEXT_PUBLIC_IDENTITY_PROVIDER_URL
  if (override) {
    return override
  }
  return 'https://identity.ic0.app/#authorize'
}

export function IcpLoginButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const handleLogin = async () => {
    try {
      setLoading(true)
      const authClient = await AuthClient.create()
      const identityProvider = getIdentityProvider()
      const derivationOrigin = getDerivationOrigin()

      await authClient.login({
        identityProvider,
        ...(derivationOrigin ? { derivationOrigin } : {}),
        maxTimeToLive: SESSION_TTL_NS
      })

      const isAuthenticated = await authClient.isAuthenticated()
      if (!isAuthenticated) {
        throw new Error('Authentication cancelled')
      }

      const identity = authClient.getIdentity() as unknown as {
        getPrincipal: () => { toText: () => string }
        getDelegation: () => { toJSON: () => unknown }
        getPublicKey: () => { toDer: () => Uint8Array }
      }

      const principal = identity.getPrincipal().toText()
      const delegation = identity.getDelegation().toJSON()
      const sessionPublicKey = toBase64(identity.getPublicKey().toDer())

      const result = await signIn('internet-identity', {
        redirect: false,
        principal,
        delegation: JSON.stringify(delegation),
        sessionPublicKey,
        callbackUrl: '/app'
      })

      if (result?.ok) {
        toast.success('Signed in with Internet Identity')
        // Ensure NextAuth client state reflects new session before navigating
        try {
          await update()
        } catch {}
        router.replace('/app')
        router.refresh()
      } else {
        throw new Error(result?.error ?? 'Authentication failed')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to authenticate'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogin}
      type='button'
      variant='secondary'
      disabled={loading}
    >
      {loading ? 'Signing in...' : 'Sign in with Internet Identity'}
    </Button>
  )
}
