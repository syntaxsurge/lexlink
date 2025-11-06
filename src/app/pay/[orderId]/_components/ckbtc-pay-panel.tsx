'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'
import type { Identity } from '@dfinity/agent'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ledgerActor } from '@/lib/ic/ckbtc/client.browser'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'
import {
  SESSION_TTL_NS,
  resolveDerivationOrigin,
  resolveIdentityProvider
} from '@/lib/internet-identity'

type TransferResult =
  | { status: 'idle' }
  | { status: 'success'; blockIndex: string }
  | { status: 'pending' }
  | { status: 'error'; message: string }

type Props = {
  orderId: string
  amountSats: string
  escrowPrincipal: string
  ckbtcSubaccountHex: string
  network: 'ckbtc-mainnet' | 'ckbtc-testnet'
}

export function CkbtcPayPanel({
  orderId,
  amountSats,
  escrowPrincipal,
  ckbtcSubaccountHex,
  network
}: Props) {
  const { status } = useSession()
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [principal, setPrincipal] = useState<Principal | null>(null)
  const [symbol, setSymbol] = useState(
    network === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'
  )
  const [decimals, setDecimals] = useState(8)
  const [balance, setBalance] = useState<bigint>(0n)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferState, setTransferState] = useState<TransferResult>({
    status: 'idle'
  })
  const [isBusy, setIsBusy] = useState(false)
  const [isHydrating, setIsHydrating] = useState(false)

  const price = useMemo(() => {
    try {
      return BigInt(amountSats)
    } catch {
      return 0n
    }
  }, [amountSats])

  const escrowOwner = useMemo(
    () => Principal.fromText(escrowPrincipal),
    [escrowPrincipal]
  )
  const escrowSubaccount = useMemo(
    () => hexToUint8Array(ckbtcSubaccountHex),
    [ckbtcSubaccountHex]
  )

  useEffect(() => {
    let cancelled = false
    AuthClient.create().then(client => {
      if (!cancelled) {
        setAuthClient(client)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const refreshBalances = useCallback(
    async (identity?: unknown) => {
      if (!authClient) return
      const activeIdentity = identity ?? (await authClient.getIdentity())
      const id = (activeIdentity as { getPrincipal: () => Principal }).getPrincipal()
      if (id.isAnonymous()) {
        setPrincipal(null)
        setBalance(0n)
        return
      }
      setPrincipal(id)
      const ledger = await ledgerActor(activeIdentity as Identity)
      const [sym, dec, bal] = await Promise.all([
        ledger.icrc1_symbol(),
        ledger.icrc1_decimals(),
        ledger.icrc1_balance_of({
          owner: id,
          subaccount: []
        })
      ])
      setSymbol(sym)
      setDecimals(Number(dec))
      setBalance(BigInt(bal))
    },
    [authClient]
  )

  const hydrateIdentity = useCallback(async () => {
    if (!authClient) return
    setIsHydrating(true)
    try {
      const authenticated = await authClient.isAuthenticated()
      if (!authenticated) {
        setPrincipal(null)
        setBalance(0n)
        return
      }
      await refreshBalances()
    } catch (error) {
      console.error('Unable to resolve Internet Identity session', error)
    } finally {
      setIsHydrating(false)
    }
  }, [authClient, refreshBalances])

  useEffect(() => {
    if (!authClient) return
    void hydrateIdentity()
  }, [authClient, hydrateIdentity])

  useEffect(() => {
    if (status === 'authenticated') {
      void hydrateIdentity()
    }
    if (status === 'unauthenticated') {
      setPrincipal(null)
      setBalance(0n)
    }
  }, [status, hydrateIdentity])

  const ensureIdentity = useCallback(async () => {
    if (!authClient) {
      throw new Error('AuthClient not initialised yet.')
    }
    const existing = await authClient.getIdentity()
    if (!existing.getPrincipal().isAnonymous()) {
      await refreshBalances(existing)
      return existing
    }

    const identityProvider = resolveIdentityProvider()
    const derivationOrigin = resolveDerivationOrigin()

    await authClient.login({
      identityProvider,
      ...(derivationOrigin ? { derivationOrigin } : {}),
      maxTimeToLive: SESSION_TTL_NS
    })

    const authenticated = await authClient.getIdentity()
    if (authenticated.getPrincipal().isAnonymous()) {
      throw new Error('Internet Identity authentication cancelled.')
    }

    await refreshBalances(authenticated)
    return authenticated
  }, [authClient, refreshBalances])

  const handleConnect = useCallback(async () => {
    try {
      setError(null)
      setFeedback(null)
      await ensureIdentity()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to authenticate with Internet Identity.'
      )
    }
  }, [ensureIdentity])

  const handlePay = useCallback(async () => {
    try {
      if (!authClient) throw new Error('Auth client not ready')
      setIsBusy(true)
      setError(null)
      setFeedback(null)
      setTransferState({ status: 'pending' })

      const identity = await ensureIdentity()
      const ledger = await ledgerActor(identity as Identity)
      const result = await ledger.icrc1_transfer({
        to: {
          owner: escrowOwner,
          subaccount: [Array.from(escrowSubaccount)]
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
        await refreshBalances(identity)
        await fetch(`/api/orders/${orderId}/refresh`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ ledgerBlock: blockIndex })
        }).catch(() => {
          // No-op: background worker will pick up the settlement
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
    authClient,
    ensureIdentity,
    escrowOwner,
    escrowSubaccount,
    orderId,
    price,
    refreshBalances
  ])

  const formattedBalance = formatTokenAmount(balance, decimals)
  const formattedPrice = formatTokenAmount(price, decimals)
  const canPay = principal !== null && balance >= price && price > 0n
  const showConnect = !principal && !isHydrating
  const payButtonLabel = isBusy
    ? 'Submitting…'
    : isHydrating
      ? 'Loading…'
      : canPay
        ? 'Pay now'
        : 'Insufficient balance'

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
            Direct ckBTC payment credits the LexLink escrow account instantly.
          </div>
        </div>

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

        <div className='flex flex-wrap gap-2'>
          {showConnect ? (
            <Button onClick={handleConnect} disabled={!authClient || isBusy}>
              Connect Internet Identity
            </Button>
          ) : (
            <Button
              onClick={handlePay}
              disabled={!canPay || isBusy || isHydrating}
            >
              {payButtonLabel}
            </Button>
          )}
          <Button
            variant='outline'
            onClick={() => {
              void refreshBalances()
            }}
            disabled={!authClient || isBusy || isHydrating}
          >
            Refresh balance
          </Button>
        </div>

        {transferState.status === 'success' && (
          <div className='rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600'>
            Transfer accepted at ledger block {transferState.blockIndex}. The order will finalize shortly.
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
            , paste your Internet Identity principal, and mint ckTESTBTC directly to your wallet. Refresh your balance once the transfer appears.
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
