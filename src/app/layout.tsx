import './globals.css'
import '@/polyfills/server-globals'

import { Inter } from 'next/font/google'

import type { Metadata } from 'next'

import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'

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
        <Providers>
          <div className='relative flex min-h-screen flex-col'>
            <SiteHeader />
            <main className='flex-1'>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
