'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { DisputeTargetTag } from '@story-protocol/core-sdk'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { raiseDispute, type RaiseDisputePayload } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  ipId: z
    .string()
    .min(1, 'Provide the IP asset identifier')
    .regex(/^0x[0-9a-fA-F]{40}$/, 'IP IDs are 0x-prefixed addresses'),
  targetTag: z.nativeEnum(DisputeTargetTag),
  evidenceCid: z.string().min(10, 'Provide the IPFS CID or URL for evidence'),
  livenessSeconds: z
    .string()
    .optional()
    .transform(value => (value ? Number(value) : undefined))
    .pipe(z.number().int().positive().optional()),
  bond: z
    .string()
    .optional()
    .transform(value => (value ? Number(value) : undefined))
    .pipe(z.number().int().min(0).optional())
})

type FormValues = z.infer<typeof schema>

type MinimalIpEntry = {
  ipId: string
  title?: string
}

export interface DisputeFormProps {
  ips?: MinimalIpEntry[]
  defaultIpId?: string
}

export function DisputeForm({ ips = [], defaultIpId }: DisputeFormProps) {
  const [result, setResult] = useState<null | {
    disputeId: string
    txHash: string
    evidenceHash: string
    constellationTx: string
    constellationExplorerUrl?: string | null
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ipId: defaultIpId ?? ''
    }
  })

  const onSubmit = (values: FormValues) => {
    setResult(null)
    setError(null)
    startTransition(async () => {
      try {
        const payload: RaiseDisputePayload = {
          ipId: values.ipId,
          evidenceCid: values.evidenceCid,
          targetTag: values.targetTag,
          livenessSeconds: values.livenessSeconds,
          bond: values.bond
        }
        const response = await raiseDispute(payload)
        setResult(response)
        form.reset()
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
          <Label htmlFor='ipId'>IP asset (ipId)</Label>
          <Input
            id='ipId'
            placeholder='0x…'
            list={ips.length > 0 ? 'known-ip-assets' : undefined}
            autoComplete='off'
            {...form.register('ipId')}
          />
          {form.formState.errors.ipId && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.ipId.message}
            </p>
          )}
          {ips.length > 0 && (
            <datalist id='known-ip-assets'>
              {ips.map(ip => (
                <option key={ip.ipId} value={ip.ipId}>
                  {ip.title ?? ip.ipId}
                </option>
              ))}
            </datalist>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='targetTag'>Dispute Tag</Label>
          <select
            id='targetTag'
            className='h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            {...form.register('targetTag')}
          >
            {Object.values(DisputeTargetTag).map(tag => (
              <option key={tag} value={tag}>
                {tag.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='evidenceCid'>Evidence CID or URL</Label>
          <Textarea
            id='evidenceCid'
            rows={2}
            placeholder='ipfs:// or https:// reference'
            {...form.register('evidenceCid')}
          />
          {form.formState.errors.evidenceCid && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.evidenceCid.message}
            </p>
          )}
        </div>
        <div className='grid gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='livenessSeconds'>Liveness (seconds)</Label>
            <Input
              id='livenessSeconds'
              placeholder='259200 (optional)'
              {...form.register('livenessSeconds')}
            />
            {form.formState.errors.livenessSeconds && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.livenessSeconds.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bond'>Bond (WIP smallest units)</Label>
            <Input id='bond' placeholder='0' {...form.register('bond')} />
            {form.formState.errors.bond && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.bond.message}
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Submitting…' : 'Raise Dispute'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Dispute ID</dt>
            <dd className='font-mono text-xs'>{result.disputeId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Tx Hash</dt>
            <dd className='break-all font-mono text-xs'>{result.txHash}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Evidence Hash
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.evidenceHash}
            </dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              Constellation Tx
            </dt>
            <dd className='break-all font-mono text-xs'>
              {result.constellationExplorerUrl ? (
                <Link
                  href={result.constellationExplorerUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary underline-offset-4 hover:underline'
                >
                  {result.constellationTx}
                </Link>
              ) : (
                result.constellationTx || 'pending'
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
