'use client'

import type { ReactNode } from 'react'

import { SessionProvider } from 'next-auth/react'

import { AppProviders } from '@/app/providers'
import { SiweAuthProvider } from '@/components/auth/siwe-auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner-toaster'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AppProviders>
        <SiweAuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </SiweAuthProvider>
      </AppProviders>
    </SessionProvider>
  )
}
