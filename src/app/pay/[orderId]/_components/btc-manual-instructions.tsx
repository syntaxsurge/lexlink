'use client'

import { useInvoiceStatus } from '@/app/pay/[orderId]/_components/invoice-status-provider'

export function BtcManualInstructions() {
  const { invoice } = useInvoiceStatus()
  return (
    <section className='space-y-2 rounded-xl border border-border bg-card/60 p-6 text-sm'>
      <h2 className='text-lg font-semibold text-foreground'>How to pay with Bitcoin</h2>
      <p>
        Send a Bitcoin transaction to the address below. LexLink finalizes the order once the configured
        confirmations are observed.
      </p>
      <div className='space-y-2 rounded-md border border-dashed border-border/50 bg-background p-3 font-mono text-xs'>
        <div>{invoice.btcAddress}</div>
        <div className='font-sans text-[11px] text-muted-foreground'>
          License wallet: {invoice.mintTo ?? 'Pending — save your wallet above before sending funds.'}
        </div>
      </div>
    </section>
  )
}
