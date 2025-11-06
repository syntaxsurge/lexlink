'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Scale,
  ScrollText,
  Settings,
  Sparkles,
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
  { href: '/dashboard/ai', label: 'AI Studio', icon: Sparkles },
  { href: '/dashboard/licenses', label: 'Licenses', icon: ScrollText },
  { href: '/dashboard/disputes', label: 'Disputes Inbox', icon: Scale },
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
          'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-all hover:border-border hover:bg-muted/40',
          isActive && 'border-primary/50 bg-primary/10 text-foreground shadow-sm'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className='h-4 w-4' />
        <span>{route.label}</span>
      </Link>
    )
  })

  return (
    <div className='flex min-h-[calc(100vh-5rem)] gap-6 py-6'>
      <aside className='hidden w-64 flex-none flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 shadow-lg md:flex'>
        <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold text-foreground'>
              {identityLabel}
            </span>
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
        <nav className='mt-6 grid gap-2'>{navItems}</nav>
        <div className='mt-auto pt-6'>
          <div className='rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground'>
            Sessions refresh every 7 days. Use Settings to rotate credentials.
          </div>
          <Button variant='ghost' size='sm' className='mt-3 w-full' onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className='flex w-full flex-col'>
        <header className='flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-background via-card to-background px-4 py-4 shadow-md'>
          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='sm'>
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-72 p-6'>
                <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3'>
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
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
              LexLink Dashboard
            </h1>
            <p className='text-sm text-muted-foreground max-w-xl'>
              Monitor registrations, settle licenses, and trace provenance across Story, ICP, and Constellation from a single control center.
            </p>
          </div>
          <div className='hidden items-center gap-2 md:flex'>
            <Button variant='outline' size='sm' asChild>
              <Link href='/report'>Report IP</Link>
            </Button>
            <Button variant='outline' size='sm' asChild>
              <Link href='/dashboard/settings'>Session settings</Link>
            </Button>
            <Button variant='ghost' size='sm' onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <main className='mt-6 flex-1 space-y-6'>{children}</main>
      </div>
    </div>
  )
}
