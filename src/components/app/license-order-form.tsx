'use client'

import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { createLicenseOrder, type IpRecord } from '@/app/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  ipKey: z.string().min(1, 'Choose an IP asset'),
  buyer: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'Buyer wallet must be 0x-prefixed EVM address'
    )
})

type FormValues = z.infer<typeof schema>

export interface LicenseOrderFormProps {
  ips: IpRecord[]
}

export function LicenseOrderForm({ ips }: LicenseOrderFormProps) {
  const [result, setResult] = useState<{
    orderId: string
    btcAddress: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const selectedIpId = form.watch('ipKey')
  const selectedIp = ips.find(ip => ip.ipId === selectedIpId)

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
          licenseTermsId: selected.licenseTermsId,
          buyer: values.buyer
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

        <div className='space-y-2'>
          <Label htmlFor='buyer'>Buyer Wallet Address</Label>
          <Input id='buyer' {...form.register('buyer')} />
          {form.formState.errors.buyer && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.buyer.message}
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending || !ips.length}>
            {isPending ? 'Allocating address…' : 'Generate BTC Invoice'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Order ID</dt>
            <dd className='break-all font-mono text-xs'>{result.orderId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Bitcoin Deposit Address
            </dt>
            <dd className='break-all font-mono text-xs'>{result.btcAddress}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
