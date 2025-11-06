'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Menu } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { logoutInternetIdentity } from '@/lib/internet-identity-client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/report', label: 'Report IP' }
]

export function SiteHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
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

  const fallback = session?.principal
    ? session.principal.replace(/-/g, '').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container-edge flex h-16 items-center justify-between'>
        <div className='flex items-center gap-6'>
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
              className='h-9 w-9 rounded-lg border border-transparent transition-all group-hover:border-border group-hover:shadow-sm sm:h-10 sm:w-10'
            />
            <span className='hidden text-base font-semibold tracking-tight text-foreground sm:inline-block sm:text-lg'>
              LexLink
            </span>
          </Link>

          <NavigationMenu className='hidden md:flex'>
            <NavigationMenuList>
              {links.map(link => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href))
                return (
                  <NavigationMenuItem key={link.href}>
                    <Link href={link.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                        active={isActive}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className='flex items-center gap-2'>
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Button asChild variant='ghost' className='hidden md:inline-flex'>
                <Link href='/dashboard'>Dashboard</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='hidden h-9 w-9 md:inline-flex'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback className='text-xs'>
                        {fallback}
                      </AvatarFallback>
                    </Avatar>
                    <span className='sr-only'>User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium'>
                        {principalLabel ?? 'Account'}
                      </p>
                      {session?.role && (
                        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                          {session.role}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/dashboard'>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/dashboard/settings'>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant='ghost' className='hidden md:inline-flex'>
                <Link href='/signin'>Sign in</Link>
              </Button>
              <Button asChild className='hidden md:inline-flex'>
                <Link href='/signin'>Get Started</Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[300px] sm:w-[400px]'>
              <nav className='flex flex-col gap-4'>
                {isAuthenticated && (
                  <div className='flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>
                        {principalLabel ?? 'Account'}
                      </span>
                      {session?.role && (
                        <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                          {session.role}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className='flex flex-col space-y-2'>
                  {links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        pathname === link.href ||
                          (link.href !== '/' && pathname.startsWith(link.href))
                          ? 'bg-secondary text-secondary-foreground'
                          : 'hover:bg-secondary/50'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isAuthenticated ? (
                    <>
                      <Link
                        href='/dashboard'
                        className='rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50'
                      >
                        Dashboard
                      </Link>
                      <Link
                        href='/dashboard/settings'
                        className='rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50'
                      >
                        Settings
                      </Link>
                      <Button
                        variant='outline'
                        className='mt-4 w-full'
                        onClick={handleSignOut}
                      >
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <div className='mt-4 flex flex-col gap-2'>
                      <Button asChild variant='outline' className='w-full'>
                        <Link href='/signin'>Sign in</Link>
                      </Button>
                      <Button asChild className='w-full'>
                        <Link href='/signin'>Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
