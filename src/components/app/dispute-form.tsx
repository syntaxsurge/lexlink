'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { submitDisputeAction } from '@/app/report/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type MinimalIpEntry = {
  ipId: string
  title?: string
}

type SubmitState =
  | { status: 'idle' }
  | {
      status: 'success'
      disputeId: string
      txHash: string
      evidenceCid: string
      evidenceUri: string
    }
  | { status: 'error'; message: string }

export interface DisputeFormProps {
  ips?: MinimalIpEntry[]
  defaultIpId?: string
}

const TAG_OPTIONS = Object.values(DisputeTargetTag)
const IP_ID_REGEX = /^0x[0-9a-fA-F]{40}$/

export function DisputeForm({ ips = [], defaultIpId }: DisputeFormProps) {
  const [state, setState] = useState<SubmitState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const ipId = String(formData.get('ipId') ?? '').trim()
    const tag = String(formData.get('tag') ?? '').trim()
    const hasFiles = formData
      .getAll('files')
      .some(value => value instanceof File && value.size > 0)
    const url = String(formData.get('url') ?? '').trim()

    if (!IP_ID_REGEX.test(ipId)) {
      setState({
        status: 'error',
        message: 'Provide a valid 0x-prefixed IP asset ID.'
      })
      return
    }

    if (!TAG_OPTIONS.includes(tag as DisputeTargetTag)) {
      setState({
        status: 'error',
        message: 'Select a dispute tag.'
      })
      return
    }

    if (!hasFiles && url.length === 0) {
      setState({
        status: 'error',
        message: 'Add at least one attachment or supply a source URL.'
      })
      return
    }

    setState({ status: 'idle' })
    startTransition(async () => {
      const result = await submitDisputeAction(formData)
      if (!result.ok) {
        setState({ status: 'error', message: result.error })
        return
      }
      setState({
        status: 'success',
        disputeId: result.disputeId,
        txHash: result.txHash,
        evidenceCid: result.evidenceCid,
        evidenceUri: result.evidenceUri
      })
      form.reset()
      if (defaultIpId) {
        const ipIdInput =
          formRef.current?.querySelector<HTMLInputElement>('#ipId')
        if (ipIdInput) {
          ipIdInput.value = defaultIpId
        }
      }
    })
  }

  return (
    <div className='space-y-6'>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='flex flex-col gap-4'
        encType='multipart/form-data'
      >
        <div className='space-y-2'>
          <Label htmlFor='ipId'>IP asset (ipId)</Label>
          <Input
            id='ipId'
            name='ipId'
            placeholder='0x…'
            defaultValue={defaultIpId ?? ''}
            autoComplete='off'
            list={ips.length > 0 ? 'known-ip-assets' : undefined}
            required
          />
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
          <Label htmlFor='tag'>Dispute tag</Label>
          <select
            id='tag'
            name='tag'
            className='h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            defaultValue={DisputeTargetTag.IMPROPER_USAGE}
            required
          >
            {TAG_OPTIONS.map(tag => (
              <option key={tag} value={tag}>
                {tag.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='note'>Note to reviewer (optional)</Label>
          <Textarea
            id='note'
            name='note'
            rows={4}
            placeholder='Summarise the infringement or reference the policy clause that was violated.'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='url'>Source URL (optional)</Label>
          <Input
            id='url'
            name='url'
            type='url'
            placeholder='https://example.com/content'
            inputMode='url'
          />
          <p className='text-xs text-muted-foreground'>
            We will snapshot and pin the URL to IPFS so the dispute references immutable content.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='files'>Evidence files</Label>
          <Input id='files' name='files' type='file' multiple />
          <p className='text-xs text-muted-foreground'>
            Upload screenshots, audio, video, or PDFs (max 25&nbsp;MB each). Files are pinned to IPFS and bundled automatically.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Submitting…' : 'Raise dispute'}
          </Button>
          {state.status === 'error' && (
            <span className='text-sm text-destructive'>{state.message}</span>
          )}
        </div>
      </form>

      {state.status === 'success' && (
        <dl className='space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Dispute ID</dt>
            <dd className='font-mono text-xs'>{state.disputeId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Evidence bundle</dt>
            <dd className='break-all font-mono text-xs'>
              <Link
                href={`https://ipfs.io/ipfs/${state.evidenceCid}`}
                target='_blank'
                rel='noreferrer'
                className='text-primary underline-offset-4 hover:underline'
              >
                ipfs://{state.evidenceCid}
              </Link>
            </dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>Transaction hash</dt>
            <dd className='break-all font-mono text-xs'>{state.txHash}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
