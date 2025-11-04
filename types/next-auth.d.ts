import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    address?: `0x${string}`
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }

  interface User {
    address?: `0x${string}`
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    address?: `0x${string}`
    principal?: string
    role?: 'operator' | 'creator' | 'viewer'
  }
}
