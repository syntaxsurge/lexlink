import './globals.css'

import { Inter } from 'next/font/google'

import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'

import { AppProviders } from '@/app/providers'
import { SiweAuthProvider } from '@/components/auth/siwe-auth-provider'
import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner-toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LexLink',
  description:
    'LexLink connects Story Protocol licensing, ICP Bitcoin escrow, and Constellation evidence into a single IP commerce platform.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <AppProviders>
            <SiweAuthProvider>
              <ThemeProvider>
                <SiteHeader />
                <main className='container-edge py-6'>{children}</main>
                <Toaster />
              </ThemeProvider>
            </SiweAuthProvider>
          </AppProviders>
        </SessionProvider>
      </body>
    </html>
  )
}
