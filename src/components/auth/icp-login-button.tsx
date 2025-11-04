'use client'

import { useState } from 'react'

import { AuthClient } from '@dfinity/auth-client'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function IcpLoginButton() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const authClient = await AuthClient.create()
      await authClient.login({
        identityProvider: 'https://identity.ic0.app/#authorize'
      })

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
        sessionPublicKey
      })

      if (result?.ok) {
        toast.success('Signed in with Internet Identity')
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
