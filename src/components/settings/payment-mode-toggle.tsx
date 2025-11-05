'use client'

import { useState, useTransition } from 'react'

import { updatePaymentModeSetting } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PaymentMode } from '@/lib/payment-mode'

const OPTIONS: Array<{
  value: PaymentMode
  label: string
  description: string
}> = [
  {
    value: 'ckbtc',
    label: 'ckBTC (Consumer)',
    description: 'Instant finality via the ckBTC minter. Ideal for demos and judge walkthroughs.'
  },
  {
    value: 'btc',
    label: 'Native BTC (Infrastructure)',
    description: 'Threshold-ECDSA addresses and UTXO polling to showcase raw Bitcoin integration.'
  }
]

export interface PaymentModeToggleProps {
  currentMode: PaymentMode
  defaultMode: PaymentMode
}

export function PaymentModeToggle({ currentMode, defaultMode }: PaymentModeToggleProps) {
  const [mode, setMode] = useState<PaymentMode>(currentMode)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const apply = (value: PaymentMode) => {
    if (value === mode) return
    setError(null)
    startTransition(async () => {
      try {
        await updatePaymentModeSetting(value)
        setMode(value)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to update payment mode right now.'
        )
      }
    })
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        {OPTIONS.map(option => {
          const active = mode === option.value
          return (
            <Button
              key={option.value}
              type='button'
              variant={active ? 'default' : 'outline'}
              className='flex h-auto flex-col items-start gap-2 p-4 text-left'
              disabled={isPending}
              onClick={() => apply(option.value)}
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold'>{option.label}</span>
                {defaultMode === option.value && <Badge variant='outline'>Default</Badge>}
                {active && <Badge>Active</Badge>}
              </div>
              <p className='text-xs text-muted-foreground'>{option.description}</p>
            </Button>
          )
        })}
      </div>
      <p className='text-xs text-muted-foreground'>
        Mode persists per operator session. Default is set via PAYMENT_MODE={defaultMode}.
      </p>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  )
}
