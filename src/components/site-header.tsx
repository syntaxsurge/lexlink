'use client'

import Link from 'next/link'

import { signOut, useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logoutInternetIdentity } from '@/lib/internet-identity-client'

const links = [{ href: '/', label: 'Home' }]

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
          className='flex items-center gap-2 text-lg font-semibold'
        >
          LexLink
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
                <Link href='/app'>Open Console</Link>
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
