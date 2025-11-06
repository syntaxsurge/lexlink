'use client'

import type { ReactNode } from 'react'

import { SessionProvider } from 'next-auth/react'

import { InternetIdentityProvider } from '@/components/auth/internet-identity-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TopNavigationLoader } from '@/components/top-navigation-loader'
import { Toaster } from '@/components/ui/sonner-toaster'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <InternetIdentityProvider>
        <ThemeProvider>
          <TopNavigationLoader />
          {children}
          <Toaster />
        </ThemeProvider>
      </InternetIdentityProvider>
    </SessionProvider>
  )
}
