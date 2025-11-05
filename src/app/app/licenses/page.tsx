import { Buffer } from 'node:buffer'

import Link from 'next/link'

import {
  loadDashboardData,
  simulateLicenseFunding,
  type LicenseRecord
} from '@/app/app/actions'
import { FinalizeLicenseForm } from '@/components/app/finalize-license-form'
import { LicenseOrderForm } from '@/components/app/license-order-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { readPaymentMode } from '@/lib/payment-mode'

const MAINNET_MEMPOOL = 'https://mempool.space'
const TESTNET_MEMPOOL = 'https://mempool.space/testnet'

function formatBtc(sats?: number) {
  if (!sats) return '—'
  return (sats / 100_000_000).toFixed(6)
}

function statusStyles(status: string) {
  switch (status) {
    case 'finalized':
      return {
        variant: 'default' as const,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      }
    case 'funded':
    case 'confirmed':
      return {
        variant: 'default' as const,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      }
    case 'failed':
    case 'expired':
      return {
        variant: 'outline' as const,
        className: 'text-destructive border-destructive/40'
      }
    default:
      return {
        variant: 'outline' as const,
        className: ''
      }
  }
}

function explorerBase(network?: string) {
  return network === 'mainnet' ? MAINNET_MEMPOOL : TESTNET_MEMPOOL
}

export default async function LicensesPage() {
  const { ips, licenses } = await loadDashboardData()
  const paymentMode = await readPaymentMode()

  const isCkbtcDefault = paymentMode === 'ckbtc'
  const pendingOrders = licenses.filter(order =>
    ['pending', 'funded', 'confirmed'].includes(order.status)
  )
  const finalizedOrders = licenses.filter(
    order => order.status === 'finalized'
  )
  const manualFinalizeOrders = pendingOrders.filter(order => order.status !== 'pending')

  const orderCardDescription = isCkbtcDefault
    ? 'Allocates a ckBTC deposit address via the ICP minter for instant UX.'
    : 'Derives a native Bitcoin address via threshold-ECDSA for on-chain settlement.'
  const finalizeCardDescription = isCkbtcDefault
    ? 'Calls update_balance on the ckBTC minter, then mints Story & Constellation artifacts.'
    : 'Confirm the Bitcoin transaction, mint a Story license token, and anchor Constellation evidence.'

  const simulateEnabled = process.env.NODE_ENV !== 'production'

  const simulateAction = async (formData: FormData) => {
    'use server'
    const orderId = formData.get('orderId')
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Missing order identifier')
    }
    await simulateLicenseFunding({ orderId })
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Generate License Order</CardTitle>
            <CardDescription>{orderCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <LicenseOrderForm ips={ips} paymentMode={paymentMode} />
          </CardContent>
        </Card>
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Finalize Sale &amp; Mint License</CardTitle>
            <CardDescription>{finalizeCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <FinalizeLicenseForm orders={manualFinalizeOrders} />
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>
            Copy deposit addresses, monitor confirmations, or finalize manually
            once funds land.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount (BTC)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Deposit Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No invoices waiting on Bitcoin settlement.
                  </TableCell>
                </TableRow>
              )}
              {pendingOrders.map(order => {
                const base = explorerBase(order.network)
                const addressUrl = `${base}/address/${order.btcAddress}`
                const txUrl = order.btcTxId
                  ? `${base}/tx/${order.btcTxId}`
                  : undefined
                const modeLabel = order.paymentMode === 'btc' ? 'BTC' : 'ckBTC'
                return (
                  <TableRow key={order.orderId}>
                    <TableCell className='font-mono text-xs'>
                      {order.orderId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.ipId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.buyer.slice(0, 10)}…
                    </TableCell>
                    <TableCell>{formatBtc(order.amountSats)}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{modeLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-mono text-xs'>{order.btcAddress}</span>
                        <Link
                          href={addressUrl}
                          target='_blank'
                          rel='noreferrer'
                          className='text-xs text-primary underline-offset-4 hover:underline'
                        >
                          View address
                        </Link>
                        {txUrl && (
                          <Link
                            href={txUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs text-primary underline-offset-4 hover:underline'
                          >
                            View transaction
                          </Link>
                        )}
                      </div>
                    </TableCell>
                   <TableCell>
                      {(() => {
                        const { variant, className } = statusStyles(order.status)
                        return (
                          <Badge variant={variant} className={className}>
                            {order.status}
                          </Badge>
                        )
                      })()}
                      {typeof order.confirmations === 'number' && (
                        <span className='ml-2 text-xs text-muted-foreground'>
                          {order.confirmations} conf
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='flex justify-end gap-2'>
                      {simulateEnabled && (
                        <form action={simulateAction} className='inline-flex'>
                          <input type='hidden' name='orderId' value={order.orderId} />
                          <Button type='submit' variant='ghost' size='sm'>
                            Simulate funding
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Finalized Licenses</CardTitle>
          <CardDescription>
            Story license tokens, C2PA bundles, and verifiable credentials for
            completed sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>License Token</TableHead>
                <TableHead>Bitcoin Tx</TableHead>
                <TableHead>Minted (sats)</TableHead>
                <TableHead>Constellation Tx</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalizedOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No finalized licenses yet.
                  </TableCell>
                </TableRow>
              )}
              {finalizedOrders.map(order => {
                const base = explorerBase(order.network)
                const modeLabel = order.paymentMode === 'btc' ? 'BTC' : 'ckBTC'
                return (
                  <TableRow key={order.orderId}>
                    <TableCell className='font-mono text-xs'>
                      {order.orderId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.ipId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.buyer.slice(0, 10)}…
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{modeLabel}</Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.tokenOnChainId || '—'}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.btcTxId ? (
                        <Link
                          href={`${base}/tx/${order.btcTxId}`}
                          target='_blank'
                          rel='noreferrer'
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          {order.btcTxId.slice(0, 14)}…
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.paymentMode === 'ckbtc' && order.ckbtcMintedSats
                        ? order.ckbtcMintedSats.toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.constellationTx ? (
                        <Link
                          href={`https://explorer.mainnet.constellationnetwork.io/transactions/${order.constellationTx}`}
                          target='_blank'
                          rel='noreferrer'
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          {order.constellationTx.slice(0, 14)}…
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge>{order.complianceScore}/100</Badge>
                    </TableCell>
                    <TableCell>
                      {order.updatedAt
                        ? new Date(order.updatedAt).toLocaleString()
                        : new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Completed Evidence Bundles</CardTitle>
          <CardDescription>
            Download C2PA archives and verifiable credentials for downstream
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {finalizedOrders.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No bundles generated yet.
            </p>
          )}
          {finalizedOrders.map(order => {
            if (!order.c2paArchive || !order.vcDocument) {
              return null
            }
            const archiveHref = `data:application/zip;base64,${order.c2paArchive}`
            const vcHref = `data:application/json;base64,${Buffer.from(
              order.vcDocument,
              'utf-8'
            ).toString('base64')}`
            return (
              <div
                key={`${order.orderId}-bundle`}
                className='flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/60 p-3 text-sm'
              >
                <div className='flex-1'>
                  <p className='font-medium'>Order {order.orderId.slice(0, 10)}…</p>
                  <p className='text-xs text-muted-foreground'>
                    License token {order.tokenOnChainId || '—'}
                  </p>
                </div>
                <Button asChild size='sm' variant='secondary'>
                  <a href={archiveHref} download={`lexlink-license-${order.orderId}.zip`}>
                    Download C2PA
                  </a>
                </Button>
                <Button asChild size='sm' variant='secondary'>
                  <a href={vcHref} download={`lexlink-license-vc-${order.orderId}.json`}>
                    Download VC
                  </a>
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
