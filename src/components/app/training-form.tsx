'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { recordTrainingBatch, type IpRecord } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  ipId: z.string().min(1, 'Select an IP asset'),
  units: z
    .number({ invalid_type_error: 'Units must be a number' })
    .int()
    .positive()
})

type FormValues = {
  ipId: string
  units: number
}

interface TrainingFormProps {
  ips: IpRecord[]
}

export function TrainingForm({ ips }: TrainingFormProps) {
  const [result, setResult] = useState<null | {
    batchId: string
    constellationTx: string
    constellationExplorerUrl?: string | null
    constellationStatus: string
    evidenceHash: string
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { units: 10 }
  })

  const submit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await recordTrainingBatch({
          ipId: values.ipId,
          units: values.units
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
    <div className='space-y-6'>
      <form
        onSubmit={form.handleSubmit(submit)}
        className='flex flex-col gap-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='ipId'>Select IP Asset</Label>
          <select
            id='ipId'
            className='h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            {...form.register('ipId')}
          >
            <option value=''>— select —</option>
            {ips.map(ip => (
              <option key={ip.ipId} value={ip.ipId}>
                {ip.title} · {ip.ipId.slice(0, 6)}…
              </option>
            ))}
          </select>
          {form.formState.errors.ipId && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.ipId.message}
            </p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='units'>Training Units</Label>
          <Input
            id='units'
            type='number'
            min={1}
            {...form.register('units', { valueAsNumber: true })}
          />
          {form.formState.errors.units && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.units.message}
            </p>
          )}
        </div>
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending || !ips.length}>
            {isPending ? 'Anchoring…' : 'Record Training Batch'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Batch ID</dt>
            <dd className='break-all font-mono text-xs'>{result.batchId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Constellation Tx
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.constellationExplorerUrl && result.constellationTx ? (
                <Link
                  href={result.constellationExplorerUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary underline-offset-4 hover:underline'
                >
                  {result.constellationTx}
                </Link>
              ) : result.constellationTx ? (
                result.constellationTx
              ) : (
                `skipped (${result.constellationStatus})`
              )}
            </dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Evidence Hash
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.evidenceHash}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
