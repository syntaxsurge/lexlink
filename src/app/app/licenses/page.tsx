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
import { env } from '@/lib/env'
import { ipfsGatewayUrl } from '@/lib/ipfs'
import { Buffer } from 'node:buffer'

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
  const ckbtcEscrowPrincipal =
    env.CKBTC_MERCHANT_PRINCIPAL ?? env.ICP_ESCROW_CANISTER_ID ?? ''

  const isCkbtcDefault = paymentMode === 'ckbtc'
  const isBtcMode = (mode?: string | null) => mode !== 'ckbtc'

  const pendingOrders = licenses.filter(order =>
    ['pending', 'funded', 'confirmed'].includes(order.status)
  )
  const finalizedOrders = licenses.filter(
    order => order.status === 'finalized'
  )
  const manualFinalizeOrders = pendingOrders.filter(
    order => isBtcMode(order.paymentMode) && order.status !== 'pending'
  )
  const orderHistory = [...licenses].sort(
    (a, b) =>
      (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
  )
  const ipTitleLookup = new Map(ips.map(ip => [ip.ipId, ip.title]))

  const orderCardDescription = isCkbtcDefault
    ? 'Generates a ckBTC escrow account so buyers can transfer ckTESTBTC directly.'
    : 'Derives a native Bitcoin address via threshold-ECDSA for on-chain settlement.'
  const finalizeCardDescription = isCkbtcDefault
    ? 'ckBTC orders finalize automatically once the escrow ledger balance updates.'
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
            {manualFinalizeOrders.length > 0 ? (
              <FinalizeLicenseForm orders={manualFinalizeOrders} />
            ) : (
              <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground'>
                All active orders will finalize automatically once ckBTC funds mint into escrow. Manual finalization only appears for native BTC invoices.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>
              Share payment targets with buyers. ckBTC invoices close themselves once the escrow ledger receives the transfer.
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
                <TableHead>Payment Destination</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No invoices waiting on Bitcoin settlement.
                  </TableCell>
                </TableRow>
              )}
              {pendingOrders.map(order => {
                const base = explorerBase(order.network)
                const isBtcPayment = isBtcMode(order.paymentMode)
                const addressUrl = isBtcPayment
                  ? `${base}/address/${order.btcAddress}`
                  : undefined
                const txUrl =
                  isBtcPayment && order.btcTxId
                    ? `${base}/tx/${order.btcTxId}`
                    : undefined
                const modeLabel = isBtcPayment ? 'BTC' : 'ckBTC'
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
                        <span className='break-all font-mono text-xs'>
                          {order.btcAddress}
                        </span>
                        {isBtcPayment && addressUrl ? (
                          <Link
                            href={addressUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs text-primary underline-offset-4 hover:underline'
                          >
                            View address
                          </Link>
                        ) : (
                          <span className='text-xs text-muted-foreground'>
                            Escrow owner: {ckbtcEscrowPrincipal || '—'}
                          </span>
                        )}
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
                      {!isBtcMode(order.paymentMode) ? (
                        <Link
                          href={`/pay/${order.orderId}`}
                          className='text-xs text-primary underline-offset-4 hover:underline'
                          target='_blank'
                          rel='noreferrer'
                        >
                          /pay/{order.orderId}
                        </Link>
                      ) : (
                        <span className='text-xs text-muted-foreground'>—</span>
                      )}
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
                      {simulateEnabled && isBtcMode(order.paymentMode) && (
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
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Chronological ledger of all license invoices with settlement status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>IP Asset</TableHead>
                <TableHead>Amount (BTC)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deposit Address</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistory.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No invoices recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {orderHistory.map(order => {
                const modeLabel = isBtcMode(order.paymentMode) ? 'BTC' : 'ckBTC'
                const statusBadge = statusStyles(order.status)
                const ipTitle =
                  ipTitleLookup.get(order.ipId) ?? order.ipId.slice(0, 10) + '…'
                return (
                  <TableRow key={`history-${order.orderId}`}>
                    <TableCell className='font-mono text-xs'>
                      {order.orderId.slice(0, 8)}…
                    </TableCell>
                    <TableCell className='text-sm'>{ipTitle}</TableCell>
                    <TableCell>{formatBtc(order.amountSats)}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{modeLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs break-all'>
                      {order.btcAddress}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {new Date(order.updatedAt ?? order.createdAt).toLocaleString()}
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
                const modeLabel = isBtcMode(order.paymentMode) ? 'BTC' : 'ckBTC'
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
                      {!isBtcMode(order.paymentMode) && order.ckbtcMintedSats
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
            if (!order.c2paArchiveUri || !order.vcDocument) {
              return null
            }
            const archiveHref = ipfsGatewayUrl(order.c2paArchiveUri)
            const vcHref = `data:application/json;base64,${Buffer.from(
              order.vcDocument,
              'utf-8'
            ).toString('base64')}`
            const archiveFileName =
              order.c2paArchiveFileName ??
              `lexlink-license-${order.orderId}.zip`
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
                  <a href={archiveHref} download={archiveFileName} target='_blank' rel='noreferrer'>
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
