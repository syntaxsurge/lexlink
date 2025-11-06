'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthClient } from '@dfinity/auth-client'
import { signIn, useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  SESSION_TTL_NS,
  resolveDerivationOrigin,
  resolveIdentityProvider
} from '@/lib/internet-identity'

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

export function IcpLoginButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const authClient = await AuthClient.create()
      const identityProvider = resolveIdentityProvider()
      const derivationOrigin = resolveDerivationOrigin()

      await authClient.login({
        identityProvider,
        maxTimeToLive: SESSION_TTL_NS,
        ...(derivationOrigin ? { derivationOrigin } : {}),
        onSuccess: async () => {
          try {
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
              callbackUrl: '/dashboard'
            })

            if (!result?.ok) {
              throw new Error(result?.error ?? 'Authentication failed')
            }

            toast.success('Signed in with Internet Identity')
            try {
              await update()
            } catch {}
            router.replace('/dashboard')
            router.refresh()
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to authenticate'
            toast.error(message)
            try {
              await authClient.logout()
            } catch {}
          } finally {
            setLoading(false)
          }
        },
        onError: async (error: unknown) => {
          const message =
            typeof error === 'string'
              ? error
              : error instanceof Error
                ? error.message
                : 'Authentication cancelled'
          toast.error(message)
          try {
            await authClient.logout()
          } catch {}
          setLoading(false)
        }
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to authenticate'
      toast.error(message)
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
