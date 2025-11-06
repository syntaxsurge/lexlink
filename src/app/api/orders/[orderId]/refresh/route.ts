import { NextRequest, NextResponse } from 'next/server'

import { autoFinalizeCkbtcOrder } from '@/app/dashboard/actions'

export const runtime = 'nodejs'

const inFlightFinalizers = new Set<string>()

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing order identifier' },
      { status: 400 }
    )
  }

  let locked = false
  try {
    if (inFlightFinalizers.has(orderId)) {
      return NextResponse.json({
        status: 'pending',
        note: 'finalization_in_progress'
      })
    }

    inFlightFinalizers.add(orderId)
    locked = true
    const result = await autoFinalizeCkbtcOrder(orderId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const lower = message.toLowerCase()
    const transient =
      lower.includes('fetch failed') ||
      lower.includes('network') ||
      lower.includes('timeout')

    if (!transient) {
      console.error('autoFinalizeCkbtcOrder failed:', error)
    }

    return NextResponse.json(
      {
        status: transient ? 'pending' : 'error',
        error: message
      },
      { status: 200 }
    )
  } finally {
    if (locked) {
      inFlightFinalizers.delete(orderId)
    }
  }
}
