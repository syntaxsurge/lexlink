'use client'

import { CkbtcPayPanel } from '@/app/pay/[orderId]/_components/ckbtc-pay-panel'
import { InvoiceSummary } from '@/app/pay/[orderId]/_components/invoice-summary'
import { CkbtcManualInstructions } from '@/app/pay/[orderId]/_components/ckbtc-manual-instructions'
import { BtcManualInstructions } from '@/app/pay/[orderId]/_components/btc-manual-instructions'
import {
  InvoiceStatusProvider,
  type InvoiceSnapshot
} from '@/app/pay/[orderId]/_components/invoice-status-provider'

type InvoicePageClientProps = {
  initialInvoice: InvoiceSnapshot
  isCkbtc: boolean
  showCkbtcPay: boolean
  escrowPrincipal?: string | null
  ckbtcNetwork: 'ckbtc-mainnet' | 'ckbtc-testnet'
  fallbackNetwork: string
}

export function InvoicePageClient({
  initialInvoice,
  isCkbtc,
  showCkbtcPay,
  escrowPrincipal,
  ckbtcNetwork,
  fallbackNetwork
}: InvoicePageClientProps) {
  return (
    <InvoiceStatusProvider
      orderId={initialInvoice.orderId}
      initialInvoice={initialInvoice}
    >
      <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10'>
        <header className='space-y-2 text-center'>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            LexLink Invoice
          </p>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Order {initialInvoice.orderId.slice(0, 8)}…
          </h1>
          <p className='text-muted-foreground'>
            {isCkbtc
              ? 'Pay with ckTESTBTC using your Internet Identity or follow the manual ckBTC instructions below.'
              : 'Send Bitcoin to the escrow address to finalize the license automatically.'}
          </p>
        </header>

        <InvoiceSummary fallbackNetwork={fallbackNetwork} />

        {isCkbtc ? (
          <>
            {showCkbtcPay && escrowPrincipal ? (
              <CkbtcPayPanel
                escrowPrincipal={escrowPrincipal}
                network={ckbtcNetwork}
              />
            ) : (
              <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600'>
                ckBTC payment is not available because the ledger configuration is incomplete for this
                deployment. Contact the operator to enable direct ckBTC settlement.
              </div>
            )}
            {escrowPrincipal ? (
              <CkbtcManualInstructions escrowPrincipal={escrowPrincipal} />
            ) : null}
          </>
        ) : (
          <BtcManualInstructions />
        )}
      </div>
    </InvoiceStatusProvider>
  )
}
