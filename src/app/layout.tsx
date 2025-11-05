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
          <SiteHeader />
          <main className='container-edge py-6'>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
