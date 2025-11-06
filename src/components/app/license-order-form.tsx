'use client'

import { useState, useTransition } from 'react'

import Link from 'next/link'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { createLicenseOrder, type IpRecord } from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { PaymentMode } from '@/lib/payment-mode'

const schema = z.object({
  ipKey: z.string().min(1, 'Choose an IP asset')
})

type FormValues = z.infer<typeof schema>

export interface LicenseOrderFormProps {
  ips: IpRecord[]
  paymentMode: PaymentMode
}

export function LicenseOrderForm({ ips, paymentMode }: LicenseOrderFormProps) {
  const [result, setResult] = useState<{
    orderId: string
    btcAddress: string
    paymentMode: PaymentMode
    ckbtcSubaccount?: string
    ckbtcEscrowPrincipal?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const selectedIpId = form.watch('ipKey')
  const selectedIp = ips.find(ip => ip.ipId === selectedIpId)
  const modeIsCkbtc = paymentMode === 'ckbtc'
  const buttonLabel = modeIsCkbtc ? 'Create ckBTC Invoice' : 'Generate BTC Invoice'
  const helperCopy = modeIsCkbtc
    ? 'Generates a ckBTC escrow account so buyers can transfer ckTESTBTC directly.'
    : 'Derives a threshold-ECDSA P2WPKH address and waits for Bitcoin confirmations.'

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    const selected = ips.find(ip => ip.ipId === values.ipKey)
    if (!selected) {
      setError('Unable to locate IP asset')
      return
    }
    startTransition(async () => {
      try {
        const created = await createLicenseOrder({
          ipId: selected.ipId,
          licenseTermsId: selected.licenseTermsId
        })
        setResult(created)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unexpected error occurred'
        )
      }
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-sm'>
        <div className='space-y-1'>
          <p className='text-xs uppercase text-muted-foreground'>Payment mode</p>
          <p className='font-medium'>
            {modeIsCkbtc ? 'ckBTC – demo friendly' : 'Native Bitcoin – infrastructure track'}
          </p>
          <p className='text-xs text-muted-foreground'>{helperCopy}</p>
        </div>
        <Badge variant='outline'>{modeIsCkbtc ? 'ckBTC' : 'BTC'}</Badge>
      </div>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='ipKey'>Select IP Asset</Label>
          <select
            id='ipKey'
            className='h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            {...form.register('ipKey')}
          >
            <option value=''>— select —</option>
            {ips.map(ip => (
              <option key={ip.ipId} value={ip.ipId}>
                {ip.title} · {(ip.priceSats / 100_000_000).toFixed(6)} BTC
              </option>
            ))}
          </select>
          {form.formState.errors.ipKey && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.ipKey.message}
            </p>
          )}
        </div>
        {selectedIp && (
          <div className='rounded-lg border border-border/60 bg-muted/20 p-3 text-sm'>
            <p>
              <span className='font-medium'>{selectedIp.title}</span> is listed at{' '}
              <span className='font-mono'>
                {(selectedIp.priceSats / 100_000_000).toFixed(6)} BTC
              </span>{' '}
              ({selectedIp.priceSats.toLocaleString()} sats).
            </p>
          </div>
        )}

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending || !ips.length}>
            {isPending ? 'Allocating address…' : buttonLabel}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          {(() => {
            const resultModeIsCkbtc = result.paymentMode === 'ckbtc'
            return (
              <>
                <div className='flex flex-col gap-1'>
                  <dt className='font-semibold text-muted-foreground'>Mode</dt>
                  <dd className='font-mono text-xs'>{result.paymentMode}</dd>
                </div>
                <div className='flex flex-col gap-1'>
                  <dt className='font-semibold text-muted-foreground'>Order ID</dt>
                  <dd className='break-all font-mono text-xs'>{result.orderId}</dd>
                </div>
                <div className='flex flex-col gap-1'>
                  <dt className='font-semibold text-muted-foreground'>
                    {resultModeIsCkbtc ? 'ckBTC ICRC Account' : 'Bitcoin Deposit Address'}
                  </dt>
                  <dd className='break-all font-mono text-xs'>{result.btcAddress}</dd>
                </div>
                {resultModeIsCkbtc && (
                  <>
                    <div className='flex flex-col gap-1'>
                      <dt className='font-semibold text-muted-foreground'>Escrow Owner Principal</dt>
                      <dd className='break-all font-mono text-xs'>
                        {result.ckbtcEscrowPrincipal ?? '—'}
                      </dd>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <dt className='font-semibold text-muted-foreground'>Order Subaccount (hex)</dt>
                      <dd className='break-all font-mono text-xs'>
                        {result.ckbtcSubaccount}
                      </dd>
                    </div>
                    <div className='space-y-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground'>
                      <p className='font-semibold text-foreground'>How the buyer pays</p>
                      <ol className='list-decimal space-y-1 pl-4'>
                        <li>
                          Visit{' '}
                          <a
                            href='https://testnet-faucet.ckboost.com/'
                            className='text-primary underline-offset-4 hover:underline'
                            target='_blank'
                            rel='noreferrer'
                          >
                            testnet-faucet.ckboost.com
                          </a>{' '}
                          and mint ckTESTBTC to the buyer&apos;s Internet Identity.
                        </li>
                        <li>Transfer ckBTC to the escrow owner + subaccount listed above, or visit the Pay link to send directly.</li>
                        <li>LexLink auto-finalizes as soon as the ledger balance updates.</li>
                      </ol>
                    </div>
                  </>
                )}
                <div className='space-y-2 rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground'>
                  <p className='font-semibold text-foreground'>
                    Share the checkout link below. Buyers authenticate with Internet Identity, set their Story wallet, and see real-time payment status.
                  </p>
                  <Link
                    href={`/pay/${result.orderId}`}
                    className='font-mono text-xs text-primary underline-offset-4 hover:underline'
                  >
                    /pay/{result.orderId}
                  </Link>
                </div>
              </>
            )
          })()}
        </dl>
      )}
    </div>
  )
}
