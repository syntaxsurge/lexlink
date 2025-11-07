'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { useSession } from 'next-auth/react'

import { setOrderMintTarget } from '@/app/dashboard/actions'
import { useInternetIdentity } from '@/components/auth/internet-identity-provider'
import { useInvoiceStatus } from '@/components/pay/invoice-status-provider'
import {
  LicenseWalletFields,
  isValidMintAddress
} from '@/components/pay/license-wallet-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ledgerActor } from '@/lib/ic/ckbtc/client.browser'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'

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
  const [mintTo, setMintTo] = useState(invoice.mintTo ?? defaultMintTo ?? '')
  const [rememberPreference, setRememberPreference] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferState, setTransferState] = useState<TransferResult>({
    status: 'idle'
  })
  const [isBusy, setIsBusy] = useState(false)

  const ckbtcSubaccountHex = invoice.ckbtcSubaccount ?? null
  const storageKey = useMemo(
    () => `lexlink:ckbtc-payment:${invoice.orderId}`,
    [invoice.orderId]
  )
  const hasRestoredState = useRef(false)
  const lastAutoPollAt = useRef(0)

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
      if (!isValidMintAddress(normalizedMintTo)) {
        throw new Error('Enter a valid 0x-prefixed EVM wallet before paying.')
      }
      if (sessionStatus !== 'authenticated') {
        throw new Error(
          'Sign in with Internet Identity before submitting payment.'
        )
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
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(
              storageKey,
              JSON.stringify({
                blockIndex,
                amount: price.toString(),
                timestamp: Date.now()
              })
            )
          } catch {
            // ignore storage failures (private mode etc.)
          }
        }
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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(storageKey)
      }
      setTransferState({
        status: 'error',
        message:
          err instanceof Error ? err.message : 'Unable to submit ckBTC payment.'
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
    sessionStatus,
    storageKey
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
    normalizedMint.length > 0 && isValidMintAddress(normalizedMint)
  const walletError =
    !isMintValid && normalizedMint.length > 0
      ? 'Wallet must be a 0x-prefixed EVM address.'
      : null
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (invoice.status === 'finalized') {
      sessionStorage.removeItem(storageKey)
      hasRestoredState.current = false
      if (
        transferState.status === 'success' ||
        transferState.status === 'pending'
      ) {
        setTransferState({ status: 'idle' })
        setFeedback(null)
      }
      return
    }

    if (hasRestoredState.current || transferState.status !== 'idle') {
      return
    }

    const raw = sessionStorage.getItem(storageKey)
    if (!raw) {
      return
    }

    try {
      const parsed = JSON.parse(raw) as {
        blockIndex?: string
        amount?: string
        timestamp?: number
      }
      if (!parsed?.blockIndex) {
        sessionStorage.removeItem(storageKey)
        return
      }
      hasRestoredState.current = true
      setTransferState({
        status: 'success',
        blockIndex: parsed.blockIndex
      })
      setFeedback(
        `Payment submitted (ledger block ${parsed.blockIndex}). The order will finalize automatically.`
      )
      if (!isFinalizing) {
        const now = Date.now()
        if (now - lastAutoPollAt.current > 5000) {
          lastAutoPollAt.current = now
          void pollFinalization().catch(() => {
            // background refresh will retry
          })
        }
      }
    } catch {
      sessionStorage.removeItem(storageKey)
    }
  }, [
    invoice.status,
    isFinalizing,
    pollFinalization,
    storageKey,
    transferState.status
  ])

  useEffect(() => {
    if (invoice.status === 'finalized') {
      return
    }
    if (transferState.status !== 'success') {
      return
    }
    if (isFinalizing) {
      return
    }
    const now = Date.now()
    if (now - lastAutoPollAt.current <= 5000) {
      return
    }
    lastAutoPollAt.current = now
    void pollFinalization().catch(() => {
      // non-blocking; background refresh continues polling
    })
  }, [invoice.status, isFinalizing, pollFinalization, transferState.status])

  return (
    <Card className='rounded-2xl border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
      <CardHeader className='space-y-2'>
        <CardTitle className='text-2xl font-semibold'>Pay with ckBTC</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Complete your payment securely using the ckBTC ledger
        </p>
      </CardHeader>
      <CardContent className='space-y-6 text-sm'>
        <div className='rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-background p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Network
            </span>
            <span className='rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary'>
              {network}
            </span>
          </div>
          <div className='mt-3 text-xs text-muted-foreground'>
            Authenticated ckBTC transfers finalize this order and mint your
            Story license automatically.
          </div>
        </div>

        {needsSession && (
          <div className='rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400'>
            <p className='font-semibold'>Authentication Required</p>
            <p className='mt-1'>
              Sign in with Internet Identity to bind this order to your
              principal and saved wallet.{' '}
              <a
                href='/signin'
                className='font-semibold text-primary underline-offset-4 hover:underline'
              >
                Open sign in
              </a>
            </p>
          </div>
        )}

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-xl border border-border/60 bg-gradient-to-br from-background to-card p-4 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Your Balance
            </p>
            <p className='mt-2 text-2xl font-bold text-foreground'>
              {formattedBalance} {symbol}
            </p>
          </div>
          <div className='rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-background p-4 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Amount Due
            </p>
            <p className='mt-2 text-2xl font-bold text-foreground'>
              {formattedPrice} {symbol}
            </p>
          </div>
        </div>

        <LicenseWalletFields
          value={mintTo}
          onChange={setMintTo}
          rememberPreference={rememberPreference}
          onRememberPreferenceChange={setRememberPreference}
          defaultMintTo={defaultMintTo}
          savedMintTo={invoice.mintTo ?? undefined}
          error={walletError}
          disabled={isBusy || isFinalized || isSettling}
          label='License receiver (EVM wallet)'
          description='We mint the Story license token to this address once payment finalizes.'
        />

        <div className='flex flex-wrap gap-3'>
          {showConnect ? (
            <Button
              onClick={handleConnect}
              disabled={!ready || isAuthenticating || isBusy}
              className='rounded-full px-6'
              size='lg'
            >
              Connect Internet Identity
            </Button>
          ) : (
            <Button
              onClick={handlePay}
              disabled={!ready || isAuthenticating || isBusy || !canPay}
              className='rounded-full px-6'
              size='lg'
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
            className='rounded-full px-6'
            size='lg'
          >
            Refresh Balance
          </Button>
        </div>

        {!isPaymentRouteReady && (
          <div className='rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400'>
            <p className='font-semibold'>Missing Escrow Metadata</p>
            <p className='mt-1'>
              This invoice is missing ckBTC escrow metadata. Contact the LexLink
              operator to regenerate the order before paying.
            </p>
          </div>
        )}

        {transferState.status === 'success' && !isFinalized && (
          <div className='rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-400'>
            <p className='font-semibold'>Transfer Accepted</p>
            <p className='mt-1'>
              Transfer accepted at ledger block {transferState.blockIndex}. The
              order will finalize shortly.
            </p>
          </div>
        )}
        {isFinalized && (
          <div className='rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 text-xs text-emerald-700 dark:text-emerald-400'>
            <p className='font-semibold'>Payment Complete</p>
            <p className='mt-1'>
              Payment finalized
              {invoice.ckbtcBlockIndex
                ? ` at ledger block ${invoice.ckbtcBlockIndex}`
                : ''}
              . License tokenization is complete.
            </p>
          </div>
        )}
        {transferState.status === 'error' && (
          <div className='rounded-xl border border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-4 text-xs text-rose-700 dark:text-rose-400'>
            <p className='font-semibold'>Payment Error</p>
            <p className='mt-1'>{transferState.message}</p>
          </div>
        )}

        <div className='space-y-3 rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 to-background p-5'>
          <div className='text-sm font-semibold text-foreground'>
            Need ckTESTBTC?
          </div>
          <div className='text-xs text-muted-foreground'>
            Use the public faucet at{' '}
            <a
              href='https://testnet-faucet.ckboost.com/'
              target='_blank'
              rel='noreferrer'
              className='font-semibold text-primary underline-offset-4 hover:underline'
            >
              testnet-faucet.ckboost.com
            </a>
            , mint ckTESTBTC to your Internet Identity principal, then refresh
            your balance above.
          </div>
        </div>

        {feedback && (
          <div className='rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-xs text-primary'>
            <p className='font-semibold'>Info</p>
            <p className='mt-1'>{feedback}</p>
          </div>
        )}
        {error && (
          <div className='rounded-xl border border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-4 text-xs text-rose-700 dark:text-rose-400'>
            <p className='font-semibold'>Error</p>
            <p className='mt-1'>{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
