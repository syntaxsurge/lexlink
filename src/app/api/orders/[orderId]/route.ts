import { NextResponse } from 'next/server'

import { loadInvoicePublic } from '@/app/app/actions'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
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
    const invoice = await loadInvoicePublic(orderId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
