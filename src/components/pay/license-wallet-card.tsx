'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'

import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { setOrderMintTarget } from '@/app/dashboard/actions'
import { useInvoiceStatus } from '@/components/pay/invoice-status-provider'
import {
  LicenseWalletFields,
  isValidMintAddress,
  shortAddress
} from '@/components/pay/license-wallet-fields'
import { Button } from '@/components/ui/button'

type LicenseWalletCardProps = {
  orderId: string
  defaultMintTo?: string | null
}

export function LicenseWalletCard({
  orderId,
  defaultMintTo
}: LicenseWalletCardProps) {
  const { data: session, status } = useSession()
  const { invoice, refresh } = useInvoiceStatus()
  const [mintTo, setMintTo] = useState<string>(
    invoice.mintTo ?? defaultMintTo ?? ''
  )
  const [rememberPreference, setRememberPreference] = useState(true)
  const [saving, startTransition] = useTransition()

  useEffect(() => {
    setMintTo(invoice.mintTo ?? defaultMintTo ?? '')
  }, [invoice.mintTo, defaultMintTo])

  const normalized = useMemo(() => mintTo.trim(), [mintTo])
  const isValid = normalized.length === 0 || isValidMintAddress(normalized)

  const principalLabel = useMemo(() => {
    if (!session?.principal) {
      return 'your II principal'
    }
    const compact = shortAddress(session.principal, 8)
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
        Sign in with Internet Identity to choose where the Story license token
        mints.
      </div>
    )
  }

  const walletError =
    !isValid && normalized.length > 0
      ? 'Wallet address must be a 0x-prefixed EVM address.'
      : null

  return (
    <div className='space-y-3 rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>License wallet</p>
          <p className='text-xs text-muted-foreground'>
            We mint the Story license token to this address after payment
            finalizes.
          </p>
        </div>
        {invoice.mintTo && (
          <span className='rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600'>
            Saved: {shortAddress(invoice.mintTo, 10)}
          </span>
        )}
      </div>
      <LicenseWalletFields
        value={mintTo}
        onChange={setMintTo}
        rememberPreference={rememberPreference}
        onRememberPreferenceChange={setRememberPreference}
        defaultMintTo={defaultMintTo}
        savedMintTo={invoice.mintTo ?? undefined}
        error={walletError}
        helperText={`Principal ${principalLabel} must save a wallet before ckBTC auto-finalization can mint your license token.`}
      />
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
            Current wallet: {shortAddress(invoice.mintTo)}
          </span>
        )}
      </div>
    </div>
  )
}
