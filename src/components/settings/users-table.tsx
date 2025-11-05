'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { toast } from 'sonner'

import { updateUserRole, type UserRecord } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

type Props = {
  users: UserRecord[]
  currentPrincipal?: string
}

const roles: Array<UserRecord['role']> = ['operator', 'creator', 'viewer']

export function UsersTable({ users, currentPrincipal }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (userId: string, role: UserRecord['role']) => {
    startTransition(async () => {
      try {
        await updateUserRole({ userId, role })
        toast.success('Role updated')
        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update role'
        toast.error(message)
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identity</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={3}
              className='text-center text-sm text-muted-foreground'
            >
              No users found.
            </TableCell>
          </TableRow>
        )}
        {users.map(user => {
          const isSelf =
            !!currentPrincipal && user.principal === currentPrincipal

          return (
            <TableRow key={user.id}>
              <TableCell className='text-sm'>
                <div className='flex flex-col gap-1'>
                  {user.principal && (
                    <span className='font-mono text-xs'>{user.principal}</span>
                  )}
                  {user.address && (
                    <span className='font-mono text-xs text-muted-foreground'>
                      {user.address}
                    </span>
                  )}
                  {!user.principal && !user.address && (
                    <span className='text-muted-foreground'>—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <select
                  defaultValue={user.role}
                  onChange={event =>
                    handleRoleChange(
                      user.id,
                      event.target.value as UserRecord['role']
                    )
                  }
                  className='rounded-md border border-input bg-transparent px-3 py-2 text-sm'
                  disabled={isPending || isSelf}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {isSelf && (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    You cannot change your own role.
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {new Date(user.createdAt).toLocaleString()}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
