import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { getConvexClient } from '@/lib/convex'
import { env } from '@/lib/env'
import { verifyInternetIdentity } from '@/lib/internet-identity'

const convex = getConvexClient()

type Role = 'operator' | 'creator' | 'viewer'

async function upsertPrincipalUser(principal: string) {
  return await convex.mutation('users:upsertByPrincipal' as any, {
    principal,
    defaultRole: 'operator'
  })
}

async function fetchRoleFromPrincipal(principal: string) {
  return await convex.query('users:getByPrincipal' as any, {
    principal
  })
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  secret: env.NEXTAUTH_SECRET,
  useSecureCookies: env.NEXTAUTH_URL.startsWith('https://'),
  debug: env.NEXTAUTH_DEBUG,
  providers: [
    CredentialsProvider({
      id: 'internet-identity',
      name: 'Internet Identity',
      credentials: {
        principal: { label: 'Principal', type: 'text' },
        delegation: { label: 'Delegation JSON', type: 'text' },
        sessionPublicKey: { label: 'Session Public Key', type: 'text' }
      },
      async authorize(credentials) {
        if (
          !credentials?.principal ||
          !credentials?.delegation ||
          !credentials?.sessionPublicKey
        ) {
          return null
        }

        const delegationJson = JSON.parse(credentials.delegation)
        const verification = verifyInternetIdentity({
          principal: credentials.principal,
          delegation: delegationJson,
          sessionPublicKey: credentials.sessionPublicKey
        })

        if (!verification) {
          return null
        }

        const profile = await upsertPrincipalUser(verification.principal)
        return {
          id: String(profile.id),
          principal: verification.principal,
          role: profile.role
        }
      }
    })
  ],
  pages: {
    signIn: '/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.principal) {
        token.principal = user.principal
        token.role = user.role as Role
      }

      if (token.principal && !token.role) {
        const profile = await fetchRoleFromPrincipal(token.principal as string)
        if (profile) {
          token.role = profile.role as Role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.principal) {
        session.principal = token.principal as string
      }
      if (token.role) {
        session.role = token.role as Role
      }
      return session
    }
  }
}
