import './globals.css'

import { Inter } from 'next/font/google'

import type { Metadata } from 'next'

import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'

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
        <ThemeProvider>
          <SiteHeader />
          <main className='container-edge'>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
