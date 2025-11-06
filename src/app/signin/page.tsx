'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import type { LucideIcon } from 'lucide-react'
import { ShieldCheck, Timer, WalletCards } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { IcpLoginButton } from '@/components/auth/icp-login-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const highlights: Array<{ icon: LucideIcon; label: string }> = [
  {
    icon: ShieldCheck,
    label: 'Hardware-grade authentication backed by ICP threshold ECDSA.'
  },
  {
    icon: WalletCards,
    label: 'Single principal unlocks IP registration, licensing, and compliance tools.'
  },
  {
    icon: Timer,
    label: 'Session stays active for seven days with automatic delegation renewal prompts.'
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
    <div className='grid min-h-[70vh] items-center gap-10 md:grid-cols-[1.25fr_1fr]'>
      <div className='space-y-6'>
        <Badge variant='outline' className='bg-primary/10 text-primary'>
          Protected access
        </Badge>
        <div className='space-y-4'>
          <h1 className='text-4xl font-semibold leading-tight md:text-5xl'>
            Internet Identity powers the LexLink operator console.
          </h1>
          <p className='max-w-xl text-base text-muted-foreground md:text-lg'>
            Sign in with a principal you control to orchestrate Story Protocol
            registrations, ICP Bitcoin escrow, and Constellation evidence. The
            session automatically seeds your operator role so you can work right
            away.
          </p>
        </div>
        <ul className='grid gap-3 text-sm text-muted-foreground sm:grid-cols-2'>
          {highlights.map(highlight => {
            const Icon = highlight.icon
            return (
              <li
                key={highlight.label}
                className='flex items-start gap-2 rounded-lg border border-border/60 bg-card/60 p-3 shadow-sm'
              >
                <span className='mt-1 text-primary'>
                  <Icon className='h-4 w-4' />
                </span>
                <span>{highlight.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <Card className='border-border/60 bg-card/70 shadow-lg'>
        <CardHeader>
          <CardTitle>Sign in with Internet Identity</CardTitle>
          <CardDescription>
            You&apos;ll be redirected to the Internet Computer identity flow.
            When the window closes, we link the delegation to your LexLink
            profile and refresh the console.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='rounded-lg border border-dashed border-primary/40 p-4 text-sm'>
            <p className='font-medium text-primary'>Delegated session</p>
            <p className='mt-1 text-muted-foreground'>
              Your principal is stored securely client-side. LexLink only
              receives a short-lived delegation that the backend validates using
              the same checks enforced across our AuthContext.
            </p>
            <div className='mt-4'>
              <IcpLoginButton />
            </div>
          </div>
          <p className='text-xs text-muted-foreground'>
            Need to rotate or revoke access? Open Settings after sign-in to
            reset your delegation and generate a fresh session.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
