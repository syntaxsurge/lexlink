'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import type { LucideIcon } from 'lucide-react'
import { ShieldCheck, Timer, WalletCards } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { IcpLoginButton } from '@/components/auth/icp-login-button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const highlights: Array<{ icon: LucideIcon; label: string }> = [
  {
    icon: ShieldCheck,
    label: 'Hardware-grade authentication backed by ICP threshold ECDSA.'
  },
  {
    icon: WalletCards,
    label:
      'Single principal unlocks IP registration, licensing, and compliance tools.'
  },
  {
    icon: Timer,
    label:
      'Session stays active for seven days with automatic delegation renewal prompts.'
  }
]

export default function SignInPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  return (
    <div className='container-edge'>
      <div className='grid min-h-[calc(100vh-10rem)] items-center gap-12 py-12 lg:grid-cols-[1.3fr_1fr]'>
        <div className='space-y-8'>
          <div className='space-y-4'>
            <Badge
              variant='outline'
              className='border-primary/30 bg-primary/10 px-3 py-1 font-medium text-primary'
            >
              Protected access
            </Badge>
            <h1 className='text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl'>
              Internet Identity powers the LexLink console
            </h1>
            <p className='max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              Sign in with a principal you control to orchestrate Story Protocol
              registrations, ICP Bitcoin escrow, and Constellation evidence.
              Your session automatically grants operator permissions.
            </p>
          </div>

          <div className='space-y-3'>
            {highlights.map(highlight => {
              const Icon = highlight.icon
              return (
                <div
                  key={highlight.label}
                  className='flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/80'
                >
                  <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <p className='pt-1 text-sm leading-relaxed text-foreground'>
                    {highlight.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <Card className='border-border/60 bg-gradient-to-b from-card to-card/50 shadow-xl backdrop-blur-sm'>
          <CardHeader className='space-y-3'>
            <CardTitle className='text-2xl'>
              Sign in with Internet Identity
            </CardTitle>
            <CardDescription className='leading-relaxed'>
              You&apos;ll be redirected to the Internet Computer identity flow.
              When the window closes, we link the delegation to your LexLink
              profile.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5'>
              <div className='space-y-2'>
                <p className='font-semibold text-primary'>Delegated session</p>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  Your principal is stored securely client-side. LexLink only
                  receives a short-lived delegation that the backend validates.
                </p>
              </div>
              <IcpLoginButton />
            </div>

            <p className='text-xs leading-relaxed text-muted-foreground'>
              Need to rotate or revoke access? Open Settings after sign-in to
              reset your delegation and generate a fresh session.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
