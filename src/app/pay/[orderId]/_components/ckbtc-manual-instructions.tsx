'use client'

import { useInvoiceStatus } from '@/app/pay/[orderId]/_components/invoice-status-provider'

export function CkbtcManualInstructions({
  escrowPrincipal
}: {
  escrowPrincipal: string
}) {
  const { invoice } = useInvoiceStatus()

  return (
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
          <p className='break-all font-mono'>{escrowPrincipal}</p>
        </div>
        <div>
          <p className='font-semibold text-muted-foreground'>Order subaccount (hex)</p>
          <p className='break-all font-mono'>
            {invoice.ckbtcSubaccount ?? 'Derived per order'}
          </p>
        </div>
        <div>
          <p className='font-semibold text-muted-foreground'>ICRC-1 account string</p>
          <p className='break-all font-mono'>{invoice.btcAddress}</p>
        </div>
        <div>
          <p className='font-semibold text-muted-foreground'>License wallet</p>
          <p className='break-all font-mono'>
            {invoice.mintTo ?? 'Pending — save your wallet above'}
          </p>
        </div>
        {typeof invoice.ckbtcMintedSats === 'number' &&
          invoice.ckbtcMintedSats > 0 && (
            <div>
              <p className='font-semibold text-muted-foreground'>Ledger amount captured</p>
              <p className='font-mono'>
                {invoice.ckbtcMintedSats.toLocaleString()} sats
              </p>
            </div>
          )}
        {typeof invoice.ckbtcBlockIndex === 'number' &&
          invoice.ckbtcBlockIndex > 0 && (
            <div>
              <p className='font-semibold text-muted-foreground'>ckBTC ledger block</p>
              <p className='font-mono'>{invoice.ckbtcBlockIndex}</p>
            </div>
          )}
      </div>
    </section>
  )
}
