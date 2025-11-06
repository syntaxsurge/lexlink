import { notFound } from 'next/navigation'

import { loadInvoicePublic, loadBuyerProfile } from '@/app/dashboard/actions'
import { InvoicePageClient } from '@/app/pay/[orderId]/_components/invoice-page-client'
import { env } from '@/lib/env'
import type { ConstellationNetworkId } from '@/lib/constellation-links'
import type { StoryNetwork } from '@/lib/story-links'

type PayInvoicePageProps = {
  params: Promise<{ orderId: string }>
}

export default async function PayInvoicePage({ params }: PayInvoicePageProps) {
  const { orderId } = await params
  const invoice = await loadInvoicePublic(orderId)

  if (!invoice) {
    notFound()
  }

  let defaultMintTo: string | null = null
  try {
    const profile = await loadBuyerProfile()
    defaultMintTo = profile.defaultMintTo
  } catch {
    defaultMintTo = null
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
      storyNetwork={env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork}
      storyLicenseAddress={env.STORY_LICENSE_TEMPLATE_ADDRESS as `0x${string}`}
      storyLicenseTokenAddress={env.STORY_LICENSE_TOKEN_ADDRESS as `0x${string}`}
      storyChainId={env.STORY_CHAIN_ID}
      constellationNetwork={env.CONSTELLATION_NETWORK as ConstellationNetworkId}
      constellationEnabled={env.CONSTELLATION_ENABLED}
      defaultMintTo={defaultMintTo}
    />
  )
}
