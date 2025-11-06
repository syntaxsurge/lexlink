import { NextRequest, NextResponse } from 'next/server'

import { autoFinalizeCkbtcOrder } from '@/app/app/actions'

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

  try {
    const result = await autoFinalizeCkbtcOrder(orderId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      error instanceof Error &&
      (message.toLowerCase().includes('fetch failed') ||
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('timeout'))
    ) {
      return NextResponse.json(
        {
          status: 'pending'
        },
        { status: 200 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
