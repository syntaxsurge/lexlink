import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }

  interface User {
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }
}
