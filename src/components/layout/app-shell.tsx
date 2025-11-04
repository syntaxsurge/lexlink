'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  BarChart3,
  BookOpen,
  Cpu,
  LayoutDashboard,
  Scale,
  ScrollText,
  Settings
} from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
}

const routes = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/ip', label: 'IP Registry', icon: BookOpen },
  { href: '/app/licenses', label: 'Licenses', icon: ScrollText },
  { href: '/app/disputes', label: 'Disputes', icon: Scale },
  { href: '/app/train', label: 'Training', icon: Cpu },
  { href: '/app/compliance', label: 'Compliance', icon: BarChart3 },
  { href: '/app/settings', label: 'Settings', icon: Settings }
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const identityLabel =
    session?.address ??
    session?.principal ??
    session?.user?.email ??
    'Signed in'

  const fallback = identityLabel.slice(0, 2).toUpperCase()

  const navItems = routes.map(route => {
    const Icon = route.icon
    const isActive =
      pathname === route.href ||
      (route.href !== '/app' && pathname.startsWith(route.href))
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
            {session?.role && (
              <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                {session.role}
              </span>
            )}
          </div>
        </div>
        <nav className='mt-6 grid gap-1'>{navItems}</nav>
        <div className='mt-auto pt-6'>
          <ConnectButton />
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
                    {session?.role && (
                      <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                        {session.role}
                      </span>
                    )}
                  </div>
                </div>
                <nav className='mt-6 grid gap-1'>{navItems}</nav>
                <div className='mt-6'>
                  <ConnectButton />
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
          <div className='hidden md:flex'>
            <ConnectButton />
          </div>
        </header>
        <main className='mt-4 flex-1'>{children}</main>
      </div>
    </div>
  )
}
