'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Menu,
  Scale,
  ScrollText,
  Settings,
  Sparkles,
  WalletCards
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { logoutInternetIdentity } from '@/lib/internet-identity-client'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
}

const routes = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/purchases', label: 'My Licenses', icon: WalletCards },
  { href: '/dashboard/ip', label: 'IP Registry', icon: BookOpen },
  { href: '/dashboard/ai', label: 'AI Studio', icon: Sparkles },
  { href: '/dashboard/licenses', label: 'Licenses', icon: ScrollText },
  { href: '/dashboard/disputes', label: 'Cases', icon: Scale },
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
    : (session?.user?.email ?? 'Signed in')

  const fallback = principal
    ? principal.replace(/-/g, '').slice(0, 2).toUpperCase()
    : 'ID'

  const navItems = routes.map(route => {
    const Icon = route.icon
    const isActive =
      pathname === route.href ||
      (route.href !== '/dashboard' && pathname.startsWith(route.href))
    return (
      <TooltipProvider key={route.href}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-all hover:border-border/50 hover:bg-accent/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive &&
                  'border-primary/20 bg-primary/10 text-foreground shadow-sm hover:bg-primary/15'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className='h-4 w-4 flex-shrink-0' />
              <span className='truncate'>{route.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side='right'>
            <p>{route.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  })

  return (
    <div className='flex min-h-[calc(100vh-4rem)] gap-6 py-6'>
      <aside className='hidden w-64 flex-none flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-4 shadow-lg backdrop-blur-sm md:flex'>
        <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/90 px-3 py-3 shadow-sm'>
          <Avatar className='h-9 w-9 ring-2 ring-border/30'>
            <AvatarFallback className='bg-primary/10 font-semibold text-primary'>
              {fallback}
            </AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-1 flex-col'>
            <span className='truncate text-sm font-semibold text-foreground'>
              {identityLabel}
            </span>
            {session?.role && (
              <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                {session.role}
              </span>
            )}
          </div>
        </div>

        <Separator className='my-4' />

        <ScrollArea className='flex-1'>
          <nav
            className='grid gap-1.5'
            role='navigation'
            aria-label='Dashboard navigation'
          >
            {navItems}
          </nav>
        </ScrollArea>

        <div className='mt-auto space-y-3 pt-6'>
          <div className='rounded-xl border border-border/60 bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground'>
            Sessions refresh every 7 days. Visit Settings to manage credentials.
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex flex-col gap-4 rounded-2xl border border-border/60 bg-gradient-to-r from-background via-card/50 to-background px-6 py-5 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='icon' className='md:hidden'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-72 p-6'>
                <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3'>
                  <Avatar className='h-9 w-9'>
                    <AvatarFallback className='bg-primary/10 font-semibold text-primary'>
                      {fallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-sm font-medium'>
                      {identityLabel}
                    </span>
                    {session?.role && (
                      <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                        {session.role}
                      </span>
                    )}
                  </div>
                </div>

                <Separator className='my-4' />

                <nav
                  className='grid gap-1'
                  role='navigation'
                  aria-label='Mobile navigation'
                >
                  {navItems}
                </nav>

                <Separator className='my-4' />

                <div className='space-y-2 text-xs text-muted-foreground'>
                  <p>Manage your session under Settings.</p>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className='space-y-1'>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
                LexLink Dashboard
              </h1>
              <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground'>
                Monitor registrations, settle licenses, and trace provenance
                across Story, ICP, and Constellation.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              asChild
              className='hidden md:inline-flex'
            >
              <Link href='/report'>Report IP</Link>
            </Button>
            <Button
              variant='outline'
              size='sm'
              asChild
              className='hidden md:inline-flex'
            >
              <Link href='/dashboard/settings'>Settings</Link>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSignOut}
              className='hidden md:inline-flex'
            >
              Sign out
            </Button>
          </div>
        </header>

        <main className='mt-6 flex-1 space-y-6' role='main'>
          {children}
        </main>
      </div>
    </div>
  )
}
