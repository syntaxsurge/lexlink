import { notFound } from 'next/navigation'

import { loadInvoicePublic } from '@/app/app/actions'
import { InvoicePageClient } from '@/app/pay/[orderId]/_components/invoice-page-client'
import { env } from '@/lib/env'

type PayInvoicePageProps = {
  params: Promise<{ orderId: string }>
}

export default async function PayInvoicePage({ params }: PayInvoicePageProps) {
  const { orderId } = await params
  const invoice = await loadInvoicePublic(orderId)

  if (!invoice) {
    notFound()
  }

  const isCkbtc = invoice.paymentMode === 'ckbtc'
  const escrowPrincipal = env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID
  const ledgerConfigured = Boolean(
    env.CKBTC_LEDGER_CANISTER_ID || env.NEXT_PUBLIC_ICP_CKBTC_LEDGER_CANISTER_ID
  )
  const hostConfigured = Boolean(
    env.CKBTC_HOST || env.NEXT_PUBLIC_ICP_CKBTC_HOST
  )
  const hasSubaccount =
    typeof invoice.ckbtcSubaccount === 'string' &&
    invoice.ckbtcSubaccount.length === 64
  const showCkbtcPay =
    isCkbtc &&
    ledgerConfigured &&
    hostConfigured &&
    Boolean(escrowPrincipal) &&
    hasSubaccount

  return (
    <InvoicePageClient
      initialInvoice={invoice}
      isCkbtc={isCkbtc}
      showCkbtcPay={showCkbtcPay}
      escrowPrincipal={escrowPrincipal}
      ckbtcNetwork={env.CKBTC_NETWORK}
      fallbackNetwork={invoice.network ?? env.BTC_NETWORK}
    />
  )
}
