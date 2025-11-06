'use client'

import { ChangeEvent, useEffect, useMemo, useState, useTransition } from 'react'

import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { setOrderMintTarget } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useInvoiceStatus } from './invoice-status-provider'

type MintTargetCardProps = {
  orderId: string
  defaultMintTo?: string | null
}

export function MintTargetCard({ orderId, defaultMintTo }: MintTargetCardProps) {
  const { data: session, status } = useSession()
  const { invoice, refresh } = useInvoiceStatus()
  const [mintTo, setMintTo] = useState<string>(invoice.mintTo ?? defaultMintTo ?? '')
  const [rememberPreference, setRememberPreference] = useState(true)
  const [saving, startTransition] = useTransition()

  useEffect(() => {
    setMintTo(invoice.mintTo ?? defaultMintTo ?? '')
  }, [invoice.mintTo, defaultMintTo])

  const normalized = useMemo(() => mintTo.trim(), [mintTo])
  const isValid =
    normalized.length === 0 ||
    /^0x[a-fA-F0-9]{40}$/i.test(normalized)

  const principalLabel = useMemo(() => {
    if (!session?.principal) {
      return 'your II principal'
    }
    const compact = short(session.principal, 8)
    return compact || session.principal
  }, [session?.principal])

  const handleSave = () => {
    if (!normalized) {
      toast.error('Enter a wallet address before saving')
      return
    }
    if (!isValid) {
      toast.error('Wallet address must be a 0x-prefixed EVM address')
      return
    }
    startTransition(async () => {
      try {
        await setOrderMintTarget({
          orderId,
          mintTo: normalized,
          rememberPreference
        })
        toast.success('License wallet saved')
        await refresh()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to save wallet'
        toast.error(message)
      }
    })
  }

  if (status !== 'authenticated') {
    return (
      <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground'>
        Sign in with Internet Identity to choose where the Story license token mints.
      </div>
    )
  }

  return (
    <div className='space-y-3 rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>License wallet</p>
          <p className='text-xs text-muted-foreground'>
            We mint the Story license token to this address after payment finalizes.
          </p>
        </div>
        {invoice.mintTo && (
          <BadgeCandidate value={invoice.mintTo} />
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='mint-to'>EVM address</Label>
        <Input
          id='mint-to'
          value={mintTo}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setMintTo(event.target.value)
          }
          placeholder='0x…'
          spellCheck={false}
        />
        {!isValid && (
          <p className='text-xs text-destructive'>
            Wallet address must be a 0x-prefixed EVM address.
          </p>
        )}
        {defaultMintTo && !invoice.mintTo && (
          <button
            type='button'
            className='text-xs text-primary underline-offset-4 hover:underline'
            onClick={() => setMintTo(defaultMintTo)}
          >
            Use saved wallet {short(defaultMintTo)}
          </button>
        )}
      </div>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <input
          id='remember-wallet'
          type='checkbox'
          className='h-4 w-4 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          checked={rememberPreference}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setRememberPreference(event.target.checked)
          }
        />
        <Label htmlFor='remember-wallet' className='cursor-pointer'>
          Remember this wallet for future purchases
        </Label>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          onClick={handleSave}
          disabled={saving || normalized.length === 0 || !isValid}
        >
          {saving ? 'Saving…' : 'Save wallet'}
        </Button>
        {invoice.mintTo && (
          <span className='text-xs text-muted-foreground'>
            Current wallet: {short(invoice.mintTo)}
          </span>
        )}
      </div>
      <p className='text-xs text-muted-foreground'>
        Principal {principalLabel} must save a wallet before ckBTC auto-finalization
        can mint your license token.
      </p>
    </div>
  )
}

function short(value: string, length = 10) {
  if (!value) return ''
  if (value.length <= length) return value
  return `${value.slice(0, length)}…`
}

function BadgeCandidate({ value }: { value: string }) {
  return (
    <span className='rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600'>
      Saved: {short(value, 10)}
    </span>
  )
}
