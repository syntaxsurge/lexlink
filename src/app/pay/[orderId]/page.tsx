import { notFound } from 'next/navigation'

import { loadInvoicePublic } from '@/app/app/actions'
import { CkbtcPayPanel } from '@/app/pay/[orderId]/_components/ckbtc-pay-panel'
import { env } from '@/lib/env'

function formatBtc(sats?: number) {
  if (!sats) return '—'
  return (sats / 100_000_000).toFixed(6)
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

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
  const showCkbtcPay =
    isCkbtc &&
    ledgerConfigured &&
    hostConfigured &&
    Boolean(escrowPrincipal) &&
    typeof invoice.ckbtcSubaccount === 'string' &&
    invoice.ckbtcSubaccount.length === 64

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10'>
      <header className='space-y-2 text-center'>
        <p className='text-sm uppercase tracking-wide text-muted-foreground'>LexLink Invoice</p>
        <h1 className='text-3xl font-semibold tracking-tight'>Order {invoice.orderId.slice(0, 8)}…</h1>
        <p className='text-muted-foreground'>
          {isCkbtc
            ? 'Pay with ckTESTBTC using your Internet Identity or follow the manual ckBTC instructions below.'
            : 'Send Bitcoin to the escrow address to finalize the license automatically.'}
        </p>
      </header>

      <section className='grid gap-4 rounded-xl border border-border bg-card/60 p-6 text-sm md:grid-cols-2'>
        <div className='space-y-1'>
          <h2 className='text-sm font-semibold text-muted-foreground'>IP Asset</h2>
          <p className='font-medium text-foreground'>{invoice.ipTitle}</p>
          <p className='font-mono text-xs text-muted-foreground'>{invoice.ipId}</p>
        </div>
        <div className='space-y-1'>
          <h2 className='text-sm font-semibold text-muted-foreground'>Amount</h2>
          <p className='font-semibold text-foreground'>{formatBtc(invoice.amountSats)} BTC</p>
          <p className='text-xs text-muted-foreground'>Listed price • network fee paid by sender.</p>
        </div>
        <div className='space-y-1'>
          <h2 className='text-sm font-semibold text-muted-foreground'>Status</h2>
          <p className='font-medium capitalize'>{invoice.status}</p>
          <p className='text-xs text-muted-foreground'>Updated {formatDate(invoice.updatedAt ?? invoice.createdAt)}</p>
        </div>
        <div className='space-y-1'>
          <h2 className='text-sm font-semibold text-muted-foreground'>Network</h2>
          <p className='font-medium text-foreground'>{invoice.network ?? env.BTC_NETWORK}</p>
          {isCkbtc && (
            <p className='text-xs text-muted-foreground'>Settlement via ckBTC ledger transfer on testnet.</p>
          )}
        </div>
      </section>

      {isCkbtc && showCkbtcPay && escrowPrincipal && (
        <CkbtcPayPanel
          orderId={invoice.orderId}
          amountSats={String(invoice.amountSats ?? 0)}
          escrowPrincipal={escrowPrincipal}
          ckbtcSubaccountHex={invoice.ckbtcSubaccount!}
          network={env.CKBTC_NETWORK}
        />
      )}

      {isCkbtc ? (
        <section className='space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-6 text-sm'>
          <h2 className='text-lg font-semibold text-foreground'>Pay with ckBTC manually</h2>
          <ol className='list-decimal space-y-3 pl-4'>
            <li>
              Mint ckTESTBTC from{' '}
              <a
                className='text-primary underline-offset-4 hover:underline'
                href='https://testnet-faucet.ckboost.com/'
                target='_blank'
                rel='noreferrer'
              >
                testnet-faucet.ckboost.com
              </a>{' '}
              using your Internet Identity.
            </li>
            <li>
              Send ckBTC to the escrow account below (owner + subaccount) or use the Pay button above.
            </li>
            <li>
              Refresh after the ledger transfer lands—LexLink finalizes the order automatically.
            </li>
          </ol>
          <div className='space-y-2 rounded-md border border-border/60 bg-card/80 p-3 text-xs'>
            <div>
              <p className='font-semibold text-muted-foreground'>Escrow owner principal</p>
              <p className='break-all font-mono'>{escrowPrincipal ?? '—'}</p>
            </div>
            <div>
              <p className='font-semibold text-muted-foreground'>Order subaccount (hex)</p>
              <p className='break-all font-mono'>{invoice.ckbtcSubaccount ?? 'Derived per order'}</p>
            </div>
            <div>
              <p className='font-semibold text-muted-foreground'>ICRC-1 account string</p>
              <p className='break-all font-mono'>{invoice.btcAddress}</p>
            </div>
            {typeof invoice.ckbtcMintedSats === 'number' && invoice.ckbtcMintedSats > 0 && (
              <div>
                <p className='font-semibold text-muted-foreground'>Ledger amount captured</p>
                <p className='font-mono'>{invoice.ckbtcMintedSats.toLocaleString()} sats</p>
              </div>
            )}
            {typeof invoice.ckbtcBlockIndex === 'number' && invoice.ckbtcBlockIndex > 0 && (
              <div>
                <p className='font-semibold text-muted-foreground'>ckBTC ledger block</p>
                <p className='font-mono'>{invoice.ckbtcBlockIndex}</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className='space-y-2 rounded-xl border border-border bg-card/60 p-6 text-sm'>
          <h2 className='text-lg font-semibold text-foreground'>How to pay with Bitcoin</h2>
          <p>Send a Bitcoin transaction to the address below. LexLink will finalize once the configured confirmations are observed.</p>
          <p className='rounded-md border border-dashed border-border/50 bg-background p-3 font-mono text-xs'>{invoice.btcAddress}</p>
        </section>
      )}
    </div>
  )
}
