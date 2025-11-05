import { cookies } from 'next/headers'

import { env } from '@/lib/env'

export type PaymentMode = 'ckbtc' | 'btc'

const COOKIE_NAME = 'lexlink_payment_mode'

export function getDefaultPaymentMode(): PaymentMode {
  return env.PAYMENT_MODE
}

export async function readPaymentMode(): Promise<PaymentMode> {
  const cookieStore = await cookies()
  const stored = cookieStore.get(COOKIE_NAME)?.value
  if (stored === 'ckbtc' || stored === 'btc') {
    return stored
  }
  return getDefaultPaymentMode()
}

export async function setPaymentModeCookie(mode: PaymentMode) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, mode, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  })
}
