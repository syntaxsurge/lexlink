'use client'

import { useMemo } from 'react'

import { useInvoiceStatus } from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { Badge } from '@/components/ui/badge'

function formatBtc(sats?: number) {
  if (!sats || sats <= 0) return '—'
  return (sats / 100_000_000).toFixed(6)
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function InvoiceSummary({
  fallbackNetwork
}: {
  fallbackNetwork: string
}) {
  const { invoice, isRefreshing } = useInvoiceStatus()

  const statusLabel = useMemo(() => {
    const base = invoice.status ?? 'pending'
    return base.replace(/_/g, ' ')
  }, [invoice.status])

  return (
    <section className='grid gap-4 rounded-xl border border-border bg-card/60 p-6 text-sm md:grid-cols-2'>
      <div className='space-y-1'>
        <h2 className='text-sm font-semibold text-muted-foreground'>
          IP Asset
        </h2>
        <p className='font-medium text-foreground'>{invoice.ipTitle}</p>
        <p className='font-mono text-xs text-muted-foreground'>
          {invoice.ipId}
        </p>
      </div>
      <div className='space-y-1'>
        <h2 className='text-sm font-semibold text-muted-foreground'>Amount</h2>
        <p className='font-semibold text-foreground'>
          {formatBtc(invoice.amountSats)} BTC
        </p>
        <p className='text-xs text-muted-foreground'>
          Listed price • network fee paid by sender.
        </p>
      </div>
      <div className='space-y-1'>
        <h2 className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
          Status
          {isRefreshing && (
            <Badge variant='outline' className='text-xs uppercase'>
              Updating
            </Badge>
          )}
        </h2>
        <p className='font-medium capitalize'>{statusLabel}</p>
        <p className='text-xs text-muted-foreground'>
          Updated {formatDate(invoice.updatedAt ?? invoice.createdAt)}
        </p>
      </div>
      <div className='space-y-1'>
        <h2 className='text-sm font-semibold text-muted-foreground'>Network</h2>
        <p className='font-medium text-foreground'>
          {invoice.network ?? fallbackNetwork}
        </p>
        {invoice.paymentMode === 'ckbtc' ? (
          <p className='text-xs text-muted-foreground'>
            Settlement via ckBTC ledger transfer.
          </p>
        ) : (
          <p className='text-xs text-muted-foreground'>
            Bitcoin settlement finalizes after on-chain confirmations.
          </p>
        )}
      </div>
      <div className='space-y-1'>
        <h2 className='text-sm font-semibold text-muted-foreground'>
          License recipient
        </h2>
        <p className='break-all font-mono text-xs text-foreground'>
          {invoice.mintTo ?? 'Pending — save a wallet below.'}
        </p>
        <p className='text-xs text-muted-foreground'>
          Address that receives the Story Protocol license token.
        </p>
        {invoice.buyerPrincipal && (
          <p className='text-[11px] text-muted-foreground'>
            Claimed by principal {invoice.buyerPrincipal}
          </p>
        )}
      </div>
    </section>
  )
}
