'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInternetIdentity } from '@/components/auth/internet-identity-provider'
import { useInvoiceStatus } from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { ledgerActor } from '@/lib/ic/ckbtc/client.browser'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'
import { setOrderMintTarget } from '@/app/dashboard/actions'

type TransferResult =
  | { status: 'idle' }
  | { status: 'success'; blockIndex: string }
  | { status: 'pending' }
  | { status: 'error'; message: string }

type CkbtcPayPanelProps = {
  escrowPrincipal: string
  network: 'ckbtc-mainnet' | 'ckbtc-testnet'
  defaultMintTo?: string | null
}

export function CkbtcPayPanel({
  escrowPrincipal,
  network,
  defaultMintTo
}: CkbtcPayPanelProps) {
  const {
    invoice,
    pollFinalization,
    refresh: refreshInvoice,
    isFinalizing
  } = useInvoiceStatus()
  const {
    ready,
    principal,
    isAuthenticating,
    connect,
    refresh: refreshIdentity,
    getIdentity
  } = useInternetIdentity()
  const { status: sessionStatus } = useSession()

  const [symbol, setSymbol] = useState(
    network === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'
  )
  const [decimals, setDecimals] = useState(8)
  const [balance, setBalance] = useState<bigint>(0n)
  const [mintTo, setMintTo] = useState(
    invoice.mintTo ?? defaultMintTo ?? ''
  )
  const [rememberPreference, setRememberPreference] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferState, setTransferState] = useState<TransferResult>({
    status: 'idle'
  })
  const [isBusy, setIsBusy] = useState(false)

  const ckbtcSubaccountHex = invoice.ckbtcSubaccount ?? null

  useEffect(() => {
    setMintTo(invoice.mintTo ?? defaultMintTo ?? '')
  }, [invoice.mintTo, defaultMintTo])

  const price = useMemo(() => {
    try {
      return BigInt(invoice.amountSats ?? 0)
    } catch {
      return 0n
    }
  }, [invoice.amountSats])

  const escrowOwner = useMemo(
    () => Principal.fromText(escrowPrincipal),
    [escrowPrincipal]
  )

  const escrowSubaccount = useMemo(() => {
    if (!ckbtcSubaccountHex) {
      return null
    }
    return hexToUint8Array(ckbtcSubaccountHex)
  }, [ckbtcSubaccountHex])

  const refreshBalances = useCallback(async () => {
    const identity = getIdentity()
    if (!identity) {
      setBalance(0n)
      setSymbol(network === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC')
      return
    }
    const id = identity.getPrincipal()
    if (id.isAnonymous()) {
      setBalance(0n)
      setSymbol(network === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC')
      return
    }
    const ledger = await ledgerActor(identity as Identity)
    const [sym, dec, bal] = await Promise.all([
      ledger.icrc1_symbol(),
      ledger.icrc1_decimals(),
      ledger.icrc1_balance_of({
        owner: id,
        subaccount: []
      })
    ])
    setSymbol(
      network === 'ckbtc-testnet' && sym === 'ckBTC' ? 'ckTESTBTC' : sym
    )
    setDecimals(Number(dec))
    setBalance(BigInt(bal))
  }, [getIdentity, network])

  useEffect(() => {
    if (!ready) return
    if (principal) {
      void refreshBalances()
    } else {
      setBalance(0n)
      setSymbol(network === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC')
    }
  }, [ready, principal, refreshBalances, network])

  const handleConnect = useCallback(async () => {
    try {
      setError(null)
      setFeedback(null)
      await connect()
      await refreshIdentity()
      await refreshBalances()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to authenticate with Internet Identity.'
      )
    }
  }, [connect, refreshIdentity, refreshBalances])

  const handlePay = useCallback(async () => {
    try {
      setIsBusy(true)
      setError(null)
      setFeedback(null)
      setTransferState({ status: 'pending' })

      const normalizedMintTo = mintTo.trim()
      if (!/^0x[a-fA-F0-9]{40}$/i.test(normalizedMintTo)) {
        throw new Error('Enter a valid 0x-prefixed EVM wallet before paying.')
      }
      if (sessionStatus !== 'authenticated') {
        throw new Error('Sign in with Internet Identity before submitting payment.')
      }

      let identity = getIdentity()
      if (!identity) {
        await connect()
        identity = getIdentity()
      }

      if (!identity) {
        throw new Error('Internet Identity authentication cancelled.')
      }

      if (!escrowSubaccount) {
        throw new Error('Order is missing escrow subaccount metadata.')
      }

      await setOrderMintTarget({
        orderId: invoice.orderId,
        mintTo: normalizedMintTo,
        rememberPreference
      })

      await refreshInvoice().catch(() => {
        // Non-blocking invoice refresh; proceeds even if background fetch fails.
      })

      const ledger = await ledgerActor(identity as Identity)
      const result = await ledger.icrc1_transfer({
        to: {
          owner: escrowOwner,
          subaccount: escrowSubaccount ? [Array.from(escrowSubaccount)] : []
        },
        amount: price,
        fee: [],
        from_subaccount: [],
        created_at_time: [],
        memo: []
      })

      if ('Ok' in result) {
        const blockIndex = result.Ok.toString()
        setTransferState({ status: 'success', blockIndex })
        await refreshBalances()
        await pollFinalization().catch(() => {
          // Finalization polling failures fall back to background refresh.
        })
        await refreshInvoice().catch(() => {
          // Non-blocking refresh.
        })
        setFeedback(
          `Payment submitted (ledger block ${blockIndex}). The order will finalize automatically.`
        )
      } else if ('Err' in result) {
        const err = result.Err
        if (err.InsufficientFunds) {
          throw new Error('Insufficient ckBTC balance to complete the payment.')
        }
        if (err.GenericError) {
          throw new Error(
            `Ledger rejected transfer: ${err.GenericError.message}`
          )
        }
        throw new Error('Ledger rejected the ckBTC transfer.')
      }
    } catch (err) {
      setTransferState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to submit ckBTC payment.'
      })
    } finally {
      setIsBusy(false)
    }
  }, [
    connect,
    getIdentity,
    escrowOwner,
    price,
    escrowSubaccount,
    mintTo,
    rememberPreference,
    refreshBalances,
    pollFinalization,
    refreshInvoice,
    invoice.orderId,
    sessionStatus
  ])

  const formattedBalance = formatTokenAmount(balance, decimals)
  const formattedPrice = formatTokenAmount(price, decimals)
  const isFinalized = invoice.status === 'finalized'
  const isPaymentRouteReady = Boolean(ckbtcSubaccountHex)
  const isSettling =
    transferState.status === 'success' ||
    transferState.status === 'pending' ||
    isFinalizing ||
    invoice.status === 'funded' ||
    invoice.status === 'confirmed'

  const normalizedMint = mintTo.trim()
  const isMintValid =
    normalizedMint.length > 0 && /^0x[a-fA-F0-9]{40}$/i.test(normalizedMint)
  const hasSavedMint = Boolean(invoice.mintTo)
  const needsSession = sessionStatus !== 'authenticated'

  const canPay =
    principal !== null &&
    !needsSession &&
    balance >= price &&
    price > 0n &&
    invoice.status === 'pending' &&
    isPaymentRouteReady &&
    isMintValid &&
    !isSettling

  const showConnect = principal === null && invoice.status === 'pending'

  const payButtonLabel = (() => {
    if (isBusy) return 'Submitting…'
    if (!ready || isAuthenticating) return 'Loading…'
    if (isFinalized) return 'Payment completed'
    if (isSettling) return 'Awaiting finalization…'
    if (needsSession) return 'Sign in to continue'
    if (!isMintValid) return 'Enter wallet'
    if (balance < price) return 'Insufficient balance'
    return 'Pay now'
  })()

  return (
    <Card className='border-border/60 bg-card/70'>
      <CardHeader>
        <CardTitle>Pay with ckBTC</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <div className='rounded-md border border-border/50 bg-muted/20 p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>Network</span>
            <span className='font-medium uppercase'>{network}</span>
          </div>
          <div className='mt-2 text-xs text-muted-foreground'>
            Authenticated ckBTC transfers finalize this order and mint your Story license automatically.
          </div>
        </div>

        {needsSession && (
          <div className='rounded-md border border-border/50 bg-amber-500/10 p-3 text-xs text-amber-600'>
            Sign in with Internet Identity to bind this order to your principal and saved wallet.
            <a
              href='/signin'
              className='ml-1 text-primary underline-offset-4 hover:underline'
            >
              Open sign in
            </a>
            .
          </div>
        )}

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-md border border-border/60 bg-background p-3'>
            <p className='text-xs text-muted-foreground'>Your balance</p>
            <p className='text-lg font-semibold'>
              {formattedBalance} {symbol}
            </p>
          </div>
          <div className='rounded-md border border-border/60 bg-background p-3'>
            <p className='text-xs text-muted-foreground'>Amount due</p>
            <p className='text-lg font-semibold'>
              {formattedPrice} {symbol}
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='mint-to'>License receiver (EVM wallet)</Label>
          <Input
            id='mint-to'
            value={mintTo}
            onChange={event => setMintTo(event.target.value)}
            placeholder='0x…'
            spellCheck={false}
          />
          <p className='text-xs text-muted-foreground'>
            We mint the Story license token to this address once payment finalizes.
          </p>
          {defaultMintTo && !invoice.mintTo && (
            <button
              type='button'
              className='text-xs text-primary underline-offset-4 hover:underline'
              onClick={() => setMintTo(defaultMintTo)}
            >
              Use saved wallet {short(defaultMintTo)}
            </button>
          )}
          {!isMintValid && mintTo.trim().length > 0 && (
            <p className='text-xs text-destructive'>
              Wallet must be a 0x-prefixed EVM address.
            </p>
          )}
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <input
              id='remember-wallet'
              type='checkbox'
              className='h-4 w-4 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              checked={rememberPreference}
              onChange={event => setRememberPreference(event.target.checked)}
            />
            <Label htmlFor='remember-wallet' className='cursor-pointer'>
              Remember this wallet for future purchases
            </Label>
          </div>
          {hasSavedMint && (
            <p className='text-xs text-muted-foreground'>
              Saved wallet: {short(invoice.mintTo as string)}
            </p>
          )}
        </div>

        <div className='flex flex-wrap gap-2'>
          {showConnect ? (
            <Button
              onClick={handleConnect}
              disabled={!ready || isAuthenticating || isBusy}
            >
              Connect Internet Identity
            </Button>
          ) : (
            <Button
              onClick={handlePay}
              disabled={!ready || isAuthenticating || isBusy || !canPay}
            >
              {payButtonLabel}
            </Button>
          )}
          <Button
            variant='outline'
            onClick={() => {
              void refreshBalances()
            }}
            disabled={!ready || isBusy || isAuthenticating}
          >
            Refresh balance
          </Button>
        </div>

        {!isPaymentRouteReady && (
          <div className='rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600'>
            This invoice is missing ckBTC escrow metadata. Contact the LexLink operator to regenerate the order before paying.
          </div>
        )}

        {transferState.status === 'success' && !isFinalized && (
          <div className='rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600'>
            Transfer accepted at ledger block {transferState.blockIndex}. The order will finalize shortly.
          </div>
        )}
        {isFinalized && (
          <div className='rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600'>
            Payment finalized{invoice.ckbtcBlockIndex
              ? ` at ledger block ${invoice.ckbtcBlockIndex}`
              : ''}. License tokenization is complete.
          </div>
        )}
        {transferState.status === 'error' && (
          <div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive'>
            {transferState.message}
          </div>
        )}

        <div className='space-y-3 rounded-md border border-border/60 bg-muted/10 p-4'>
          <div className='text-sm font-semibold text-muted-foreground'>
            Need ckTESTBTC?
          </div>
          <div className='text-xs text-muted-foreground'>
            Use the public faucet at{' '}
            <a
              href='https://testnet-faucet.ckboost.com/'
              target='_blank'
              rel='noreferrer'
              className='text-primary underline-offset-4 hover:underline'
            >
              testnet-faucet.ckboost.com
            </a>
            , mint ckTESTBTC to your Internet Identity principal, then refresh your balance above.
          </div>
        </div>

        {feedback && (
          <div className='rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-primary'>
            {feedback}
          </div>
        )}
        {error && (
          <div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive'>
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function short(value: string, length = 10) {
  if (!value) return ''
  if (value.length <= length) return value
  return `${value.slice(0, length)}…`
}
