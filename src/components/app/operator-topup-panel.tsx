'use client'

import { useCallback, useState, useTransition } from 'react'

import { allocateOperatorTopUp, mintOperatorTopUp } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import type { CkbtcSnapshot } from '@/app/app/actions'

function formatBtc(e8s: string, decimals: number): string {
  if (!e8s) return '0'
  const value = BigInt(e8s)
  const base = BigInt(10) ** BigInt(decimals)
  const whole = value / base
  const fraction = value % base
  if (fraction === 0n) {
    return whole.toString()
  }
  return `${whole.toString()}.${fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')}`
}

export function OperatorTopUpPanel({ snapshot }: { snapshot: CkbtcSnapshot }) {
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<{
    mintedSats: string
    pending: boolean
  } | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async () => {
    if (!depositAddress) return
    try {
      await navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy deposit address', err)
    }
  }, [depositAddress])

  if (!snapshot.enabled) {
    return null
  }

  const handleAllocate = () => {
    setError(null)
    setFeedback(null)
    setMintResult(null)
    startTransition(async () => {
      try {
        const result = await allocateOperatorTopUp()
        setDepositAddress(result.depositAddress)
        setFeedback('Deposit address allocated. Send tBTC, then poll for minting.')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to allocate deposit address.'
        setError(message)
      }
    })
  }

  const handleMint = () => {
    setError(null)
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await mintOperatorTopUp()
        setMintResult(result)
        if (result.pending) {
          setFeedback('No ckBTC minted yet. Confirmations are still pending.')
        } else if (result.mintedSats === '0') {
          setFeedback('ckBTC mint succeeded but reported 0 sats. Verify the deposit.')
        } else {
          setFeedback('ckBTC minted successfully into your operator wallet.')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to mint ckBTC from the minter.'
        setError(message)
      }
    })
  }

  return (
    <Card className='border-border/60 bg-card/70'>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Fund Operator ckBTC</CardTitle>
          <Badge variant='outline'>{snapshot.network}</Badge>
        </div>
        <CardDescription>
          Allocate a Bitcoin testnet deposit address for your Internet Identity, then mint
          ckBTC once confirmations land.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <div className='flex flex-wrap gap-2'>
          <Button disabled={isPending} onClick={handleAllocate}>
            {isPending ? 'Requesting…' : 'Allocate deposit address'}
          </Button>
          <Button
            variant='secondary'
            disabled={isPending || !depositAddress}
            onClick={handleMint}
          >
            {isPending ? 'Checking…' : 'Check deposit / Mint'}
          </Button>
        </div>
        {error && (
          <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive'>
            {error}
          </div>
        )}
        {feedback && (
          <div className='rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-primary'>
            {feedback}
          </div>
        )}
        {depositAddress && (
          <div className='space-y-2 rounded-md border border-border/60 bg-muted/20 p-3'>
            <p className='text-xs uppercase text-muted-foreground'>Deposit address</p>
            <code className='block break-all text-xs'>{depositAddress}</code>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={copyToClipboard}
                disabled={copied}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <span className='text-xs text-muted-foreground'>
                Send Bitcoin testnet (tBTC) from any wallet. ckBTC mints after a few confirmations.
              </span>
            </div>
          </div>
        )}
        <ol className='space-y-2 rounded-md border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground list-decimal pl-4'>
          <li>Click “Allocate deposit address”.</li>
          <li>Send tBTC to the address shown above.</li>
          <li>After confirmations, click “Check deposit / Mint”.</li>
          <li>Your operator balance updates immediately in the overview metrics.</li>
        </ol>
        {mintResult && !mintResult.pending && (
          <div className='rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-500'>
            Minted{' '}
            <span className='font-semibold text-emerald-600'>
              {formatBtc(mintResult.mintedSats, snapshot.decimals)} {snapshot.symbol}
            </span>{' '}
            into the operator account.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
