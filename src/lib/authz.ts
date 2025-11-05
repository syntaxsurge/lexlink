import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

type Role = 'operator' | 'creator' | 'viewer'

export type SessionActor = {
  principal: string
  role: Role
}

export async function requireSession(): Promise<SessionActor> {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Authentication required')
  }

  if (!session.principal) {
    throw new Error('Authentication required')
  }

  return {
    principal: session.principal,
    role: (session.role as Role) ?? 'viewer'
  }
}

export async function requireRole(allowed: Role[]): Promise<SessionActor> {
  const actor = await requireSession()
  if (!allowed.includes(actor.role)) {
    throw new Error(
      `Insufficient permissions. Required roles: ${allowed.join(', ')}`
    )
  }
  return actor
}
