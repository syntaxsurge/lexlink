'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'

import {
  respondToDisputeAction,
  settleDisputeAction,
  toggleDisputeWatchAction
} from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { storyScanBase } from '@/lib/story-links'

type CaseActionsProps = {
  disputeId: string
  principal: string
  ownerPrincipal?: string
  reporterPrincipal: string
  watchers?: string[]
  status: string
  respondedAt?: number
  resolvedAt?: number
  livenessDeadline?: number
}

export function CaseActions({
  disputeId,
  principal,
  ownerPrincipal,
  reporterPrincipal,
  watchers,
  status,
  respondedAt,
  resolvedAt,
  livenessDeadline
}: CaseActionsProps) {
  const storyNetwork =
    (process.env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'
  const [respondOpen, setRespondOpen] = useState(false)
  const [respondPending, setRespondPending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(
    watchers?.includes(principal) ?? false
  )
  const [followPending, startFollowTransition] = useTransition()
  const [settlePending, startSettleTransition] = useTransition()

  const isOwner = ownerPrincipal === principal
  const isReporter = reporterPrincipal === principal
  const isResolved =
    status === 'resolved' || status === 'settled' || Boolean(resolvedAt)
  const canRespond = isOwner && !isResolved && !respondedAt
  const canSettle =
    !isResolved &&
    typeof livenessDeadline === 'number' &&
    Date.now() >= livenessDeadline
  const canFollow = !isOwner && !isReporter

  const handleRespondSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (respondPending) return
    setRespondPending(true)
    setError(null)
    setResultMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('disputeId', disputeId)

    const result = await respondToDisputeAction(formData)
    if (!result.ok) {
      setError(result.error)
    } else {
      setResultMessage(result.txHash)
      setRespondOpen(false)
    }
    setRespondPending(false)
    event.currentTarget.reset?.()
  }

  const handleSettle = () => {
    setError(null)
    setResultMessage(null)
    startSettleTransition(async () => {
      try {
        const response = await settleDisputeAction(disputeId)
        setResultMessage(response.txHash)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to settle dispute.'
        )
      }
    })
  }

  const handleFollowToggle = (next: boolean) => {
    setError(null)
    setResultMessage(null)
    startFollowTransition(async () => {
      try {
        await toggleDisputeWatchAction({
          disputeId,
          follow: next
        })
        setFollowing(next)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to update watchlist.'
        )
      }
    })
  }

  return (
    <div className='space-y-2 text-xs'>
      <div className='flex flex-wrap items-center gap-2'>
        {canRespond && (
          <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>Respond with evidence</Button>
            </DialogTrigger>
            <DialogContent className='max-w-xl'>
              <DialogHeader>
                <DialogTitle>Submit counter evidence</DialogTitle>
                <DialogDescription>
                  Upload files or snapshot a URL. Everything is pinned to IPFS
                  and shared with UMA&apos;s arbitrators.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRespondSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor={`files-${disputeId}`}>Evidence files</Label>
                  <Input
                    id={`files-${disputeId}`}
                    type='file'
                    name='files'
                    multiple
                    disabled={respondPending}
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Accepts screenshots, video, audio, PDFs, and ZIP archives
                    up to 25&nbsp;MB each.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`url-${disputeId}`}>Snapshot URL</Label>
                  <Input
                    id={`url-${disputeId}`}
                    name='url'
                    type='url'
                    placeholder='https://example.com/proof'
                    disabled={respondPending}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`note-${disputeId}`}>Note</Label>
                  <Textarea
                    id={`note-${disputeId}`}
                    name='note'
                    rows={3}
                    placeholder='Explain why the report should be rejected or add policy references.'
                    disabled={respondPending}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type='submit'
                    disabled={respondPending}
                    className='w-full'
                  >
                    {respondPending ? 'Submitting…' : 'Send response'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {canSettle && (
          <Button
            size='sm'
            variant='outline'
            onClick={handleSettle}
            disabled={settlePending}
          >
            {settlePending ? 'Settling…' : 'Settle on Story'}
          </Button>
        )}

        {canFollow && (
          <Button
            size='sm'
            variant={following ? 'default' : 'ghost'}
            onClick={() => handleFollowToggle(!following)}
            disabled={followPending}
          >
            {following ? 'Following' : 'Follow case'}
          </Button>
        )}
      </div>
      {resultMessage && (
        <div className='font-mono text-[11px] text-muted-foreground'>
          <Link
            href={`${storyScanBase(storyNetwork)}/tx/${resultMessage}`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
          >
            {resultMessage}
          </Link>
        </div>
      )}
      {error && <div className='text-[11px] text-destructive'>{error}</div>}
    </div>
  )
}

function shorten(value?: string | null) {
  if (!value) return ''
  if (value.length <= 12) {
    return value
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}
