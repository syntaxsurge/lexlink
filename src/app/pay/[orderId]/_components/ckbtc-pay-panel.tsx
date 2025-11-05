'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import ledgerIdl from '@/lib/ic/ckbtc/idl/ledger.idl'
import minterIdl from '@/lib/ic/ckbtc/idl/minter.idl'
import { formatTokenAmount, hexToUint8Array } from '@/lib/ic/ckbtc/utils'

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
  ledgerCanisterId: string
  minterCanisterId: string
  icpHost: string
}

const IDENTITY_PROVIDER = 'https://identity.ic0.app'

function needsRootKey(host: string) {
  return host.includes('127.0.0.1') || host.includes('localhost')
}

export function CkbtcPayPanel({
  orderId,
  amountSats,
  escrowPrincipal,
  ckbtcSubaccountHex,
  network,
  ledgerCanisterId,
  minterCanisterId,
  icpHost
}: Props) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [principal, setPrincipal] = useState<Principal | null>(null)
  const [symbol, setSymbol] = useState('ckBTC')
  const [decimals, setDecimals] = useState(8)
  const [balance, setBalance] = useState<bigint>(0n)
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferState, setTransferState] = useState<TransferResult>({
    status: 'idle'
  })
  const [isBusy, setIsBusy] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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
    AuthClient.create().then(setAuthClient)
  }, [])

  const createAgent = useCallback(
    async (identity?: unknown) => {
      const { HttpAgent } = await import('@dfinity/agent')
      const agent = new HttpAgent({
        host: icpHost,
        identity: identity as never
      })
      if (needsRootKey(icpHost)) {
        await agent.fetchRootKey().catch(() => {
          console.warn('Unable to fetch root key from local replica.')
        })
      }
      return agent
    },
    [icpHost]
  )

  const createLedgerActor = useCallback(
    async (identity: unknown) => {
      const { Actor } = await import('@dfinity/agent')
      const agent = await createAgent(identity)
      return Actor.createActor(ledgerIdl as never, {
        agent,
        canisterId: ledgerCanisterId
      }) as {
        icrc1_symbol: () => Promise<string>
        icrc1_decimals: () => Promise<number>
        icrc1_balance_of: (args: {
          owner: Principal
          subaccount: [] | [number[]]
        }) => Promise<bigint>
        icrc1_transfer: (args: Record<string, unknown>) => Promise<
          | { Ok: bigint }
          | {
              Err: {
                InsufficientFunds?: { balance: bigint }
                GenericError?: { message: string; error_code: bigint }
                TemporarilyUnavailable?: null
                Duplicate?: { duplicate_of: bigint }
                BadFee?: { expected_fee: bigint }
              }
            }
        >
      }
    },
    [createAgent, ledgerCanisterId]
  )

  const createMinterActor = useCallback(
    async (identity: unknown) => {
      const { Actor } = await import('@dfinity/agent')
      const agent = await createAgent(identity)
      return Actor.createActor(minterIdl as never, {
        agent,
        canisterId: minterCanisterId
      }) as {
        get_btc_address: (args: {
          owner: [Principal]
          subaccount: [] | [number[]]
        }) => Promise<string>
        update_balance: (args: {
          owner: [Principal]
          subaccount: [] | [number[]]
        }) => Promise<
          | { Ok: bigint }
          | {
              Err: {
                NoNewUtxos?: null
                AlreadyProcessing?: null
                TemporarilyUnavailable?: null
                GenericError?: { error_message: string; error_code: bigint }
              }
            }
        >
      }
    },
    [createAgent, minterCanisterId]
  )

  const refreshBalances = useCallback(
    async (identity?: unknown) => {
      if (!authClient) return
      const activeIdentity = identity ?? (await authClient.getIdentity())
      const ledger = await createLedgerActor(activeIdentity)
      const id = (activeIdentity as { getPrincipal: () => Principal }).getPrincipal()
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
    [authClient, createLedgerActor]
  )

  const ensureIdentity = useCallback(async () => {
    if (!authClient) {
      throw new Error('AuthClient not initialised yet.')
    }
    const identity = await authClient.getIdentity()
    if (identity.getPrincipal().isAnonymous()) {
      await authClient.login({
        identityProvider: IDENTITY_PROVIDER,
        onSuccess: async () => {
          const authenticated = await authClient.getIdentity()
          setPrincipal(authenticated.getPrincipal())
          await refreshBalances(authenticated)
        }
      })
      return authClient.getIdentity()
    }
    setPrincipal(identity.getPrincipal())
    return identity
  }, [authClient, refreshBalances])

  const handleConnect = useCallback(async () => {
    try {
      setError(null)
      setFeedback(null)
      const identity = await ensureIdentity()
      await refreshBalances(identity)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to authenticate with Internet Identity.'
      )
    }
  }, [ensureIdentity, refreshBalances])

  const handleRequestDepositAddress = useCallback(async () => {
    try {
      if (!authClient) throw new Error('Auth client not ready')
      const identity = await ensureIdentity()
      const minter = await createMinterActor(identity)
      const owner = (identity as { getPrincipal: () => Principal }).getPrincipal()
      const address = await minter.get_btc_address({
        owner: [owner],
        subaccount: []
      })
      setDepositAddress(address)
      setFeedback('Send tBTC to this address, then click “Update balance”.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to obtain ckBTC deposit address.'
      )
    }
  }, [authClient, createMinterActor, ensureIdentity])

  const handleUpdateBalance = useCallback(async () => {
    try {
      if (!authClient) throw new Error('Auth client not ready')
      setIsUpdating(true)
      const identity = await ensureIdentity()
      const minter = await createMinterActor(identity)
      const owner = (identity as { getPrincipal: () => Principal }).getPrincipal()
      const result = await minter.update_balance({
        owner: [owner],
        subaccount: []
      })
      if ('Ok' in result) {
        const minted = BigInt(result.Ok)
        await refreshBalances(identity)
        setFeedback(
          minted > 0n
            ? `Minted ${formatTokenAmount(minted, decimals)} ${symbol}.`
            : 'No new ckBTC minted yet. Wait for more confirmations.'
        )
      } else if ('Err' in result && 'NoNewUtxos' in result.Err) {
        setFeedback('No new UTXOs yet. Wait a bit longer and try again.')
      } else {
        const err = result.Err
        if (err.GenericError) {
          throw new Error(err.GenericError.error_message)
        }
        throw new Error('ckBTC minter temporarily unavailable.')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to mint ckBTC from deposit address.'
      )
    } finally {
      setIsUpdating(false)
    }
  }, [authClient, createMinterActor, decimals, ensureIdentity, refreshBalances, symbol])

  const handlePay = useCallback(async () => {
    try {
      if (!authClient) throw new Error('Auth client not ready')
      setIsBusy(true)
      setError(null)
      setFeedback(null)
      setTransferState({ status: 'pending' })

      const identity = await ensureIdentity()
      const ledger = await createLedgerActor(identity)
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
    createLedgerActor,
    ensureIdentity,
    escrowOwner,
    escrowSubaccount,
    orderId,
    price,
    refreshBalances
  ])

  const formattedBalance = formatTokenAmount(balance, decimals)
  const formattedPrice = formatTokenAmount(price, decimals)
  const canPay = balance >= price && price > 0n
  const showConnect = !principal

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
            <Button onClick={handlePay} disabled={!canPay || isBusy}>
              {isBusy
                ? 'Submitting…'
                : canPay
                  ? 'Pay now'
                  : 'Insufficient balance'}
            </Button>
          )}
          <Button
            variant='outline'
            onClick={refreshBalances}
            disabled={!authClient || isBusy}
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
            Get a deposit address from the ckBTC minter, send Bitcoin testnet (tBTC) to it, then mint ckTESTBTC into your wallet.
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={handleRequestDepositAddress}
              disabled={!authClient || isBusy}
            >
              Get deposit address
            </Button>
            <Button
              variant='outline'
              onClick={handleUpdateBalance}
              disabled={!authClient || isUpdating}
            >
              {isUpdating ? 'Minting…' : 'Update balance'}
            </Button>
          </div>
          {depositAddress && (
            <div className='space-y-2 rounded-md border border-border/60 bg-background p-3'>
              <Label htmlFor='ckbtc-deposit-address'>ckBTC minter deposit address</Label>
              <Input
                id='ckbtc-deposit-address'
                value={depositAddress}
                readOnly
                onFocus={event => event.currentTarget.select()}
              />
              <p className='text-xs text-muted-foreground'>
                Use any Bitcoin testnet wallet or faucet (e.g. mempool.space/testnet). After confirmations, click “Update balance”.
              </p>
            </div>
          )}
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
