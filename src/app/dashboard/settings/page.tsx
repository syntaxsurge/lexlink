import { Settings, User, Users, Sparkles } from 'lucide-react'
import { getServerSession } from 'next-auth'

import { loadUsers } from '@/app/dashboard/actions'
import { UsersTable } from '@/components/settings/users-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authOptions } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Authentication required')
  }

  const isOperator = session.role === 'operator'
  let users: Awaited<ReturnType<typeof loadUsers>> = []
  let usersError: string | null = null

  if (isOperator) {
    try {
      users = await loadUsers()
    } catch (error) {
      console.error('Failed to load users from Convex', error)
      usersError =
        'The team roster could not be retrieved from Convex. Check your network connection and try again.'
    }
  }

  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary'
          >
            <Settings className='mr-2 h-3 w-3' />
            Settings
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              Account & Team Settings
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              Manage your Internet Identity session, configure team roles, and
              control access to operator functionality.
            </p>
          </div>
        </div>
      </section>

      <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
        <CardHeader className='space-y-4 pb-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
              <User className='h-6 w-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Current Session
              </CardTitle>
              <CardDescription className='text-sm'>
                Internet Identity principal associated with the active console
                session
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
        <CardContent className='space-y-3 pt-6 text-sm'>
          {session.principal && (
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                ICP Principal
              </p>
              <p className='font-mono text-xs'>{session.principal}</p>
            </div>
          )}
          <div>
            <p className='text-xs uppercase text-muted-foreground'>Role</p>
            <Badge>{session.role ?? 'viewer'}</Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            Roles are stored in Convex and determine access to operator tooling.
            New Internet Identity sessions default to <strong>operator</strong>
            so you can manage licensing workflows immediately.
          </p>
        </CardContent>
      </Card>

      {isOperator && (
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start gap-3'>
              <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-background p-3 shadow-lg'>
                <Users className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
              </div>
              <div className='space-y-1'>
                <CardTitle className='text-2xl font-bold'>Team Roles</CardTitle>
                <CardDescription className='text-sm'>
                  Promote or demote collaborators across operator, creator, and
                  viewer tiers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='space-y-6 pt-6'>
            {usersError && (
              <Alert variant='destructive'>
                <AlertTitle>Unable to load team roles</AlertTitle>
                <AlertDescription>{usersError}</AlertDescription>
              </Alert>
            )}
            <UsersTable users={users} currentPrincipal={session.principal} />
          </CardContent>
        </Card>
      )}

      {!isOperator && (
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-amber-500/10 to-background shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start gap-3'>
              <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/10 to-background p-3 shadow-lg'>
                <Sparkles className='h-6 w-6 text-amber-600 dark:text-amber-400' />
              </div>
              <div className='space-y-1'>
                <CardTitle className='text-2xl font-bold'>
                  Need Elevated Permissions?
                </CardTitle>
                <CardDescription className='text-sm'>
                  Only operators can register IP, generate invoices, and settle
                  licenses. Ask an operator to upgrade your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
