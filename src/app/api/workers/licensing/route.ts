import { NextResponse } from 'next/server'

import { completeLicenseSaleSystem } from '@/app/app/actions'
import { env } from '@/lib/env'
import { getConvexClient } from '@/lib/convex'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_CONFIRMATIONS = env.BTC_NETWORK === 'mainnet' ? 3 : 1

type Network = 'testnet' | 'mainnet'

type FundingStatus = {
  totalReceived: number
  txid?: string
  confirmations: number
  confirmed: boolean
}

function buildMempoolBase(network: Network) {
  const base = env.MEMPOOL_API_BASE.replace(/\/$/, '')
  return network === 'testnet' ? `${base}/testnet/api` : `${base}/api`
}

async function fetchTipHeight(base: string) {
  const res = await fetch(`${base}/blocks/tip/height`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch tip height: ${res.status}`)
  }
  const text = await res.text()
  return Number(text.trim())
}

async function fetchFundingStatus(
  address: string,
  network: Network
): Promise<FundingStatus> {
  const base = buildMempoolBase(network)
  const summaryRes = await fetch(`${base}/address/${address}`, {
    cache: 'no-store'
  })
  if (!summaryRes.ok) {
    throw new Error(`mempool address summary failed (${summaryRes.status})`)
  }
  const summary = await summaryRes.json()
  const totalReceived: number =
    Number(summary.chain_stats?.funded_txo_sum ?? 0) +
    Number(summary.mempool_stats?.funded_txo_sum ?? 0)

  const txsRes = await fetch(`${base}/address/${address}/txs`, {
    cache: 'no-store'
  })
  if (!txsRes.ok) {
    throw new Error(`mempool address txs failed (${txsRes.status})`)
  }
  const txs = (await txsRes.json()) as Array<any>

  const tipHeight = await fetchTipHeight(base)

  for (const tx of txs) {
    const outputs: Array<any> = tx.vout ?? []
    const matchesAddress = outputs.some(
      output => output.scriptpubkey_address === address
    )
    if (!matchesAddress) continue

    const confirmed: boolean = Boolean(tx.status?.confirmed)
    const blockHeight: number | undefined = tx.status?.block_height
    const confirmations = confirmed && blockHeight ? tipHeight - blockHeight + 1 : 0

    return {
      totalReceived,
      txid: tx.txid as string,
      confirmations: confirmations > 0 ? confirmations : 0,
      confirmed
    }
  }

  return {
    totalReceived,
    txid: undefined,
    confirmations: 0,
    confirmed: false
  }
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_IC_NETWORK === 'local') {
    return NextResponse.json({ skipped: true, reason: 'local network' })
  }

  const convex = getConvexClient()

  const pending = (await convex.query('licenses:listByStatus' as any, {
    status: 'pending'
  })) as any[]
  const funded = (await convex.query('licenses:listByStatus' as any, {
    status: 'funded'
  })) as any[]

  const candidates = [...pending, ...funded]
  const logs: Array<Record<string, unknown>> = []

  for (const order of candidates) {
    try {
      const amount = Number(order.amountSats ?? 0)
      if (!order.btcAddress || !amount) {
        continue
      }

      const paymentMode: 'ckbtc' | 'btc' = order.paymentMode === 'btc' ? 'btc' : 'ckbtc'

      if (paymentMode === 'ckbtc') {
        try {
          await completeLicenseSaleSystem({
            orderId: order.orderId,
            receiver: order.buyer as `0x${string}`
          })
          logs.push({ orderId: order.orderId, mode: 'ckbtc', finalized: true })
        } catch (error) {
          logs.push({
            orderId: order.orderId,
            mode: 'ckbtc',
            note: (error as Error).message
          })
        }
        continue
      }

      const network: Network = order.network === 'mainnet' ? 'mainnet' : 'testnet'
      const funding = await fetchFundingStatus(order.btcAddress, network)

      if (funding.totalReceived < amount) {
        logs.push({ orderId: order.orderId, status: order.status, note: 'awaiting funds' })
        continue
      }

      if (order.status === 'pending') {
        await convex.mutation('licenses:updateFundingState' as any, {
          orderId: order.orderId,
          status: 'funded',
          btcTxId: funding.txid,
          confirmations: funding.confirmations
        })
        logs.push({ orderId: order.orderId, updated: 'funded' })
      }

      if (funding.txid && funding.confirmations >= MIN_CONFIRMATIONS) {
        await convex.mutation('licenses:updateFundingState' as any, {
          orderId: order.orderId,
          status: 'confirmed',
          btcTxId: funding.txid,
          confirmations: funding.confirmations
        })

        await completeLicenseSaleSystem({
          orderId: order.orderId,
          btcTxId: funding.txid,
          receiver: order.buyer as `0x${string}`
        })
        logs.push({ orderId: order.orderId, finalized: true })
      }
    } catch (error) {
      logs.push({ orderId: order.orderId, error: (error as Error).message })
    }
  }

  return NextResponse.json({ processed: candidates.length, logs })
}
