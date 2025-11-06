'use client'

import Image from 'next/image'
import Link from 'next/link'

import { signOut, useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logoutInternetIdentity } from '@/lib/internet-identity-client'

const links = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/marketplace', label: 'Marketplace' }
]

export function SiteHeader() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const handleSignOut = () => {
    void (async () => {
      await logoutInternetIdentity()
      await signOut({ callbackUrl: '/' })
    })()
  }

  const principalLabel = session?.principal
    ? `${session.principal.split('-').slice(0, 2).join('-')}…`
    : null

  return (
    <header className='border-b bg-background/80 backdrop-blur'>
      <div className='container-edge flex items-center justify-between gap-4 py-4'>
        <Link
          href='/'
          className='group flex items-center gap-3 text-lg font-semibold leading-none'
        >
          <Image
            src='/images/lexlink-logo.png'
            alt='LexLink logo'
            width={40}
            height={40}
            priority
            sizes='40px'
            className='h-9 w-9 rounded-md border border-transparent transition-all group-hover:border-foreground/20 group-hover:shadow-sm sm:h-10 sm:w-10'
          />
          <span className='text-base font-semibold tracking-tight text-foreground sm:text-lg'>
            LexLink
          </span>
        </Link>
        <nav className='flex items-center gap-2'>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                'hidden sm:inline-flex'
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Button asChild variant='secondary'>
                <Link href='/dashboard'>Open Console</Link>
              </Button>
              <Button variant='ghost' onClick={handleSignOut}>
                {principalLabel ?? session?.principal ?? 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant='ghost'>
                <Link href='/signin'>Sign in</Link>
              </Button>
              <Button asChild>
                <Link href='/signin'>Launch Console</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
