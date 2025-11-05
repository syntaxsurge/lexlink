'use client'

import { AuthClient } from '@dfinity/auth-client'

export async function logoutInternetIdentity() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const client = await AuthClient.create()
    const isAuthenticated = await client.isAuthenticated()
    if (isAuthenticated) {
      await client.logout()
    }
  } catch (error) {
    console.error('Failed to clear Internet Identity session', error)
  }
}
