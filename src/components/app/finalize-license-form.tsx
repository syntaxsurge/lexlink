'use client'

import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { completeLicenseSale, type LicenseRecord } from '@/app/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  orderId: z.string().min(1),
  btcTxId: z.string().min(6),
  receiver: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Receiver must be an 0x-prefixed address')
})

type FormValues = z.infer<typeof schema>

export function FinalizeLicenseForm({ orders }: { orders: LicenseRecord[] }) {
  const [result, setResult] = useState<null | {
    licenseTokenId: string
    attestationHash: string
    constellationTx: string
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await completeLicenseSale({
          orderId: values.orderId,
          btcTxId: values.btcTxId,
          receiver: values.receiver as `0x${string}`
        })
        setResult(response)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unexpected error occurred'
        )
      }
    })
  }

  return (
    <div className='rounded-xl border bg-card p-6'>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='orderId'>Pending Order</Label>
          <select
            id='orderId'
            className='h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            {...form.register('orderId')}
          >
            <option value=''>— select —</option>
            {orders.map(order => (
              <option key={order.orderId} value={order.orderId}>
                {order.orderId.slice(0, 8)}… – {order.ipId.slice(0, 6)}… –{' '}
                {order.buyer.slice(0, 6)}…
              </option>
            ))}
          </select>
          {form.formState.errors.orderId && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.orderId.message}
            </p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='btcTxId'>Bitcoin Transaction Hash</Label>
          <Input id='btcTxId' {...form.register('btcTxId')} />
          {form.formState.errors.btcTxId && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.btcTxId.message}
            </p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='receiver'>License Receiver</Label>
          <Input id='receiver' {...form.register('receiver')} />
          {form.formState.errors.receiver && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.receiver.message}
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending || !orders.length}>
            {isPending ? 'Finalizing…' : 'Finalize Sale'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='mt-6 space-y-3 rounded-lg border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              License Token ID
            </dt>
            <dd className='font-mono text-xs'>{result.licenseTokenId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Attestation Hash
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.attestationHash}
            </dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Constellation Tx
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.constellationTx}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
