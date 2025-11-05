'use client'

import type { ReactNode } from 'react'

import { SessionProvider } from 'next-auth/react'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner-toaster'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
