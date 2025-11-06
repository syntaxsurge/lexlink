'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import {
  BarChart3,
  BookOpen,
  Cpu,
  LayoutDashboard,
  Scale,
  ScrollText,
  Settings,
  WalletCards
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { logoutInternetIdentity } from '@/lib/internet-identity-client'

type AppShellProps = {
  children: ReactNode
}

const routes = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/purchases', label: 'My Licenses', icon: WalletCards },
  { href: '/dashboard/ip', label: 'IP Registry', icon: BookOpen },
  { href: '/dashboard/licenses', label: 'Licenses', icon: ScrollText },
  { href: '/dashboard/disputes', label: 'Disputes', icon: Scale },
  { href: '/dashboard/train', label: 'Training', icon: Cpu },
  { href: '/dashboard/compliance', label: 'Compliance', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings }
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = () => {
    void (async () => {
      await logoutInternetIdentity()
      await signOut({ callbackUrl: '/' })
    })()
  }

  const principal = session?.principal ?? null
  const identityLabel = principal
    ? principal.split('-').slice(0, 2).join('-') + '…'
    : session?.user?.email ?? 'Signed in'

  const fallback = principal
    ? principal.replace(/-/g, '').slice(0, 2).toUpperCase()
    : 'ID'

  const navItems = routes.map(route => {
    const Icon = route.icon
    const isActive =
      pathname === route.href ||
      (route.href !== '/dashboard' && pathname.startsWith(route.href))
    return (
      <Link
        key={route.href}
        href={route.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60',
          isActive && 'bg-muted text-foreground shadow-sm'
        )}
      >
        <Icon className='h-4 w-4' />
        <span>{route.label}</span>
      </Link>
    )
  })

  return (
    <div className='flex min-h-[calc(100vh-5rem)] gap-6 py-6'>
      <aside className='hidden w-60 flex-none flex-col rounded-xl border border-border bg-card/60 p-4 md:flex'>
        <div className='flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{identityLabel}</span>
            {principal && (
              <span className='text-xs font-mono text-muted-foreground'>
                {principal}
              </span>
            )}
            {session?.role && (
              <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                {session.role}
              </span>
            )}
          </div>
        </div>
        <nav className='mt-6 grid gap-1'>{navItems}</nav>
        <div className='mt-auto pt-6 flex items-center justify-between'>
          <p className='text-xs text-muted-foreground'>
            Sessions refresh every 7 days.
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className='flex w-full flex-col'>
        <header className='flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 shadow-sm'>
          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='sm'>
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-72 p-6'>
                <div className='flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2'>
                  <Avatar className='h-9 w-9'>
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{identityLabel}</span>
                    {principal && (
                      <span className='text-xs font-mono text-muted-foreground'>
                        {principal}
                      </span>
                    )}
                    {session?.role && (
                      <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                        {session.role}
                      </span>
                    )}
                  </div>
                </div>
                <nav className='mt-6 grid gap-1'>{navItems}</nav>
                <div className='mt-6 text-xs text-muted-foreground'>
                  Manage your session under Settings.
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div>
            <h1 className='text-lg font-semibold leading-tight'>
              LexLink Console
            </h1>
            <p className='text-sm text-muted-foreground'>
              Onboard IP, allocate Bitcoin invoices, and anchor evidence across
              Story, ICP, and Constellation.
            </p>
          </div>
          <div className='hidden items-center gap-2 md:flex'>
            <Button variant='outline' size='sm' asChild>
              <Link href='/dashboard/settings'>Session settings</Link>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </header>
        <main className='mt-4 flex-1'>{children}</main>
      </div>
    </div>
  )
}
