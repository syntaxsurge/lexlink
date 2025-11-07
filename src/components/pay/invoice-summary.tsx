'use client'

import { useMemo } from 'react'

import { useInvoiceStatus } from '@/components/pay/invoice-status-provider'
import { Badge } from '@/components/ui/badge'

function formatBtc(sats?: number) {
  if (!sats || sats <= 0) return '—'
  return (sats / 100_000_000).toFixed(6)
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function InvoiceSummary({ networkLabel }: { networkLabel: string }) {
  const { invoice, isRefreshing } = useInvoiceStatus()

  const statusLabel = useMemo(() => {
    const base = invoice.status ?? 'pending'
    return base.replace(/_/g, ' ')
  }, [invoice.status])

  const statusColor = useMemo(() => {
    const status = invoice.status ?? 'pending'
    if (status === 'finalized') return 'emerald'
    if (status === 'funded' || status === 'confirmed') return 'blue'
    return 'amber'
  }, [invoice.status])

  return (
    <section className='rounded-2xl border border-border/60 bg-gradient-to-br from-card via-background to-card p-8 shadow-xl'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-foreground'>Order Details</h2>
        {isRefreshing && (
          <Badge variant='outline' className='text-xs uppercase'>
            Updating...
          </Badge>
        )}
      </div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <div className='space-y-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            IP Asset
          </h3>
          <p className='text-base font-semibold text-foreground'>
            {invoice.ipTitle}
          </p>
          <p className='break-all font-mono text-[11px] text-muted-foreground'>
            {invoice.ipId}
          </p>
        </div>

        <div className='space-y-2 rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/10 to-background/50 p-4 backdrop-blur-sm'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Amount
          </h3>
          <p className='text-2xl font-bold text-foreground'>
            {formatBtc(invoice.amountSats)} ckBTC
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Listed price • network fee paid by sender
          </p>
        </div>

        <div className='space-y-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Status
          </h3>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className={`capitalize ${
                statusColor === 'emerald'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : statusColor === 'blue'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}
            >
              {statusLabel}
            </Badge>
          </div>
          <p className='text-[11px] text-muted-foreground'>
            Updated {formatDate(invoice.updatedAt ?? invoice.createdAt)}
          </p>
        </div>

        <div className='space-y-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Network
          </h3>
          <p className='text-base font-semibold text-foreground'>
            {invoice.network ?? networkLabel}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Settlement via ckBTC ledger transfer
          </p>
        </div>

        <div className='space-y-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm md:col-span-2'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            License Recipient
          </h3>
          <p className='break-all font-mono text-xs text-foreground'>
            {invoice.mintTo ?? 'Pending — save a wallet below'}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Address that receives the Story Protocol license token
          </p>
          {invoice.buyerPrincipal && (
            <p className='text-[11px] text-muted-foreground'>
              Claimed by principal {invoice.buyerPrincipal}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
