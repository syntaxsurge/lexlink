import { NextResponse } from 'next/server'

import { autoFinalizeCkbtcOrder } from '@/app/dashboard/actions'
import { getConvexClient } from '@/lib/convex'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NEXT_PUBLIC_IC_NETWORK === 'local') {
    return NextResponse.json({ skipped: true, reason: 'local network' })
  }

  const convex = getConvexClient()

  const pending = (await convex.query('licenses:listByStatus' as any, {
    status: 'pending'
  })) as any[]
  const funded = (await convex.query('licenses:listByStatus' as any, {
    status: 'funded'
  })) as any[]

  const candidates = [...pending, ...funded]
  const logs: Array<Record<string, unknown>> = []

  for (const order of candidates) {
    try {
      if (!order.ckbtcSubaccount) {
        logs.push({
          orderId: order.orderId,
          status: order.status,
          note: 'missing_ckbtc_metadata'
        })
        continue
      }
      const receiverAddress = order.mintTo ?? order.buyer
      if (!receiverAddress) {
        logs.push({
          orderId: order.orderId,
          status: order.status,
          note: 'waiting_for_recipient'
        })
        continue
      }

      const result = await autoFinalizeCkbtcOrder(order.orderId)
      logs.push({
        orderId: order.orderId,
        status: order.status,
        outcome: result.status
      })
    } catch (error) {
      logs.push({ orderId: order.orderId, error: (error as Error).message })
    }
  }

  return NextResponse.json({ processed: candidates.length, logs })
}
