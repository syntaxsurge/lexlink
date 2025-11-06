'use client'

import { useState, useTransition } from 'react'

import {
  resolveDisputeAction,
  setDisputeJudgement
} from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'

type DisputeRowActionsProps = {
  disputeId: string
  status: string
  network: string
}

export function DisputeRowActions({
  disputeId,
  status,
  network
}: DisputeRowActionsProps) {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canSimulate = network !== 'mainnet' && status === 'raised'
  const canResolve = status === 'upheld' || status === 'rejected'

  const handleJudgement = (uphold: boolean) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await setDisputeJudgement({
          disputeId,
          uphold
        })
        setResult(response.txHash ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set judgement')
      }
    })
  }

  const handleResolve = () => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await resolveDisputeAction(disputeId)
        setResult(response.txHash ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resolve dispute')
      }
    })
  }

  const statusMessage =
    status === 'resolved'
      ? 'Dispute resolved'
      : network === 'mainnet' && status === 'raised'
        ? 'Waiting for UMA judgement'
        : 'Judgement recorded'

  return (
    <div className='flex flex-col gap-2 text-xs'>
      <div className='flex flex-wrap items-center gap-2'>
        {canSimulate ? (
          <>
            <Button
              size='sm'
              variant='outline'
              disabled={isPending}
              onClick={() => handleJudgement(true)}
            >
              Uphold
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={isPending}
              onClick={() => handleJudgement(false)}
            >
              Reject
            </Button>
          </>
        ) : (
          <span className='text-muted-foreground'>{statusMessage}</span>
        )}
        {canResolve && (
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-foreground'
            disabled={isPending}
            onClick={handleResolve}
          >
            Resolve
          </Button>
        )}
      </div>
      {result && (
        <span className='font-mono text-[11px] text-muted-foreground'>
          tx: {result.slice(0, 10)}…
        </span>
      )}
      {error && (
        <span className='text-[11px] text-destructive'>
          {error}
        </span>
      )}
    </div>
  )
}
