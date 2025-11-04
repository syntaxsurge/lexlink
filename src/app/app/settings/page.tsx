import { getServerSession } from 'next-auth'

import { loadUsers } from '@/app/app/actions'
import { UsersTable } from '@/components/settings/users-table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { authOptions } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Authentication required')
  }

  const isOperator = session.role === 'operator'
  const users = isOperator ? await loadUsers() : []

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>
            Wallet or Internet Identity used to access protected console routes.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          {session.address && (
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                EVM Address
              </p>
              <p className='font-mono text-xs'>{session.address}</p>
            </div>
          )}
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
            SIWE sign-ins default to <strong>operator</strong>; Internet
            Identity sign-ins default to <strong>viewer</strong>.
          </p>
        </CardContent>
      </Card>

      {isOperator && (
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Team Roles</CardTitle>
            <CardDescription>
              Promote or demote collaborators across operator, creator, and
              viewer tiers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={users}
              currentAddress={session.address}
              currentPrincipal={session.principal}
            />
          </CardContent>
        </Card>
      )}

      {!isOperator && (
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Need elevated permissions?</CardTitle>
            <CardDescription>
              Only operators can register IP, generate invoices, and settle
              licenses. Ask an operator to upgrade your account.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
