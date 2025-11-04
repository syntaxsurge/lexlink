'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSession } from 'next-auth/react'

import { IcpLoginButton } from '@/components/auth/icp-login-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export default function SignInPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/app')
    }
  }, [status, router])

  return (
    <div className='mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to LexLink</CardTitle>
          <CardDescription>
            Choose your preferred identity. Wallet operators sign with Ethereum;
            consumers and reviewers can use Internet Identity.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg border border-dashed p-4 text-sm'>
            <p className='font-medium'>Sign-In with Ethereum (operators)</p>
            <p className='mt-1 text-muted-foreground'>
              Connect a Story-compatible wallet and sign the SIWE challenge to
              access operator tooling.
            </p>
            <div className='mt-4'>
              <ConnectButton />
            </div>
          </div>
          <div className='rounded-lg border border-dashed p-4 text-sm'>
            <p className='font-medium'>Internet Identity (consumer access)</p>
            <p className='mt-1 text-muted-foreground'>
              Passwordless identity backed by ICP. Perfect for licensees
              reviewing their rights.
            </p>
            <div className='mt-4'>
              <IcpLoginButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
