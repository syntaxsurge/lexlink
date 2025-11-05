import { notFound } from 'next/navigation'

import { loadInvoicePublic } from '@/app/app/actions'
import { env } from '@/lib/env'

function formatBtc(sats?: number) {
  if (!sats) return '—'
  return (sats / 100_000_000).toFixed(6)
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default async function PayInvoicePage({
  params
}: {
  params: { orderId: string }
}) {
  const invoice = await loadInvoicePublic(params.orderId)

  if (!invoice) {
    notFound()
  }

  const isCkbtc = invoice.paymentMode !== 'btc'

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10'>
      <header className='space-y-2 text-center'>
        <p className='text-sm uppercase tracking-wide text-muted-foreground'>LexLink Invoice</p>
        <h1 className='text-3xl font-semibold tracking-tight'>Order {invoice.orderId.slice(0, 8)}…</h1>
        <p className='text-muted-foreground'>
          Pay with {isCkbtc ? 'ckTESTBTC' : 'Bitcoin'} to finalize the license automatically.
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
            <p className='text-xs text-muted-foreground'>Settlement via ckBTC minter (testnet).</p>
          )}
        </div>
      </section>

      {isCkbtc ? (
        <section className='space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-6 text-sm'>
          <h2 className='text-lg font-semibold text-foreground'>How to pay with ckTESTBTC</h2>
          <ol className='list-decimal space-y-3 pl-4'>
            <li>
              <p>
                Send testnet BTC (tBTC) to this deposit address. The ckBTC minter tracks this address for the escrow canister.
              </p>
              <p className='mt-2 rounded-md border border-dashed border-primary/50 bg-background p-3 font-mono text-xs'>{invoice.btcAddress}</p>
            </li>
            <li>
              <p>
                Wait a few confirmations. The LexLink escrow canister polls <code>update_balance</code> on the ckBTC minter and mints ckTESTBTC when funds are final.
              </p>
            </li>
            <li>
              <p>
                LexLink automatically mints the Story license token and logs evidence—no manual action required. Refresh this page to see the status switch to <strong>finalized</strong>.
              </p>
            </li>
          </ol>
          <div className='space-y-2 rounded-md border border-border/60 bg-card/80 p-3'>
            <p className='text-xs uppercase text-muted-foreground'>Need ckTESTBTC?</p>
            <ul className='list-disc space-y-1 pl-4 text-xs text-muted-foreground'>
              <li>
                Use any public Bitcoin testnet faucet (e.g.{' '}
                <a
                  className='underline underline-offset-4'
                  href='https://mempool.space/testnet/faucet'
                  target='_blank'
                  rel='noreferrer'
                >
                  mempool.space/testnet
                </a>
                ).
              </li>
              <li>
                After the transaction confirms, the escrow canister completes the sale automatically.
              </li>
            </ul>
          </div>
          <div className='grid gap-2 rounded-md border border-border/50 bg-background/80 p-3 text-xs'>
            <div>
              <p className='font-semibold text-muted-foreground'>Escrow Subaccount</p>
              <p className='break-all font-mono'>{invoice.ckbtcSubaccount ?? 'Derived per order'}</p>
            </div>
            {typeof invoice.ckbtcMintedSats === 'number' && invoice.ckbtcMintedSats > 0 && (
              <div>
                <p className='font-semibold text-muted-foreground'>Minted Amount</p>
                <p className='font-mono'>{invoice.ckbtcMintedSats.toLocaleString()} sats</p>
              </div>
            )}
            {typeof invoice.ckbtcBlockIndex === 'number' && invoice.ckbtcBlockIndex > 0 && (
              <div>
                <p className='font-semibold text-muted-foreground'>ckBTC Ledger Block</p>
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
