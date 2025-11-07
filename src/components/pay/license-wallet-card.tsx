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
      <div className='rounded-xl border border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-6 text-sm text-muted-foreground shadow-sm'>
        <p className='font-medium text-foreground'>Authentication Required</p>
        <p className='mt-1'>
          Sign in with Internet Identity to choose where the Story license token
          mints.
        </p>
      </div>
    )
  }

  const walletError =
    !isValid && normalized.length > 0
      ? 'Wallet address must be a 0x-prefixed EVM address.'
      : null

  return (
    <div className='space-y-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-background to-card p-6 shadow-xl'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-base font-semibold text-foreground'>
            License Wallet
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            We mint the Story license token to this address after payment
            finalizes.
          </p>
        </div>
        {invoice.mintTo && (
          <span className='rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400'>
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
      <div className='flex items-center gap-3'>
        <Button
          type='button'
          onClick={handleSave}
          disabled={saving || normalized.length === 0 || !isValid}
          className='rounded-full px-6'
          size='lg'
        >
          {saving ? 'Saving…' : 'Save Wallet'}
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
