import { Buffer } from 'node:buffer'

import Link from 'next/link'

import { Download, ExternalLink, Share2 } from 'lucide-react'

import { loadDashboardData } from '@/app/dashboard/actions'
import { LicenseOrderPanel } from '@/components/app/license-order-panel'
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
import { TextDialog } from '@/components/ui/text-dialog'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'
import { ipfsGatewayUrl } from '@/lib/ipfs'
const CONSTELLATION_NETWORK =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

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

type LicensesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function LicensesPage({ searchParams }: LicensesPageProps) {
  const { ips, licenses } = await loadDashboardData()
  const ckbtcEscrowPrincipal =
    env.CKBTC_MERCHANT_PRINCIPAL ??
    env.NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID ??
    ''
  const focusedIpId =
    typeof searchParams?.ip === 'string' ? searchParams.ip : undefined

  const pendingOrders = licenses.filter(order =>
    ['pending', 'funded', 'confirmed'].includes(order.status)
  )
  const finalizedOrders = licenses.filter(order => order.status === 'finalized')
  const orderHistory = [...licenses].sort(
    (a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
  )
  const ipTitleLookup = new Map(ips.map(ip => [ip.ipId, ip.title]))

  return (
    <div className='space-y-6'>
      <LicenseOrderPanel ips={ips} defaultIpId={focusedIpId} />
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>
            Share payment targets with buyers. ckBTC invoices finalize automatically once the escrow ledger receives the transfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {pendingOrders.length === 0 && (
              <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center'>
                <p className='text-sm text-muted-foreground'>
                  No invoices waiting on ckBTC settlement.
                </p>
              </div>
            )}
            {pendingOrders.map(order => {
              const mintTarget = order.mintTo ?? order.buyer ?? null
              const ipTitle = ipTitleLookup.get(order.ipId) ?? order.ipId
              const { variant, className } = statusStyles(order.status)
              const mintedSats =
                typeof order.ckbtcMintedSats === 'number' &&
                order.ckbtcMintedSats > 0
                  ? order.ckbtcMintedSats
                  : null
              const subaccount =
                typeof order.ckbtcSubaccount === 'string' &&
                order.ckbtcSubaccount.length > 0
                  ? order.ckbtcSubaccount
                  : null
              const ledgerBlock =
                typeof order.ckbtcBlockIndex === 'number' &&
                order.ckbtcBlockIndex > 0
                  ? order.ckbtcBlockIndex
                  : null

              return (
                <div
                  key={order.orderId}
                  className='rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm transition-all hover:shadow-md'
                >
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='flex-1 space-y-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='text-sm font-semibold'>{ipTitle}</h3>
                        <Badge variant={variant} className={className}>
                          {order.status}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          ckBTC
                        </Badge>
                        {mintedSats && (
                          <Badge variant='outline' className='text-xs'>
                            {mintedSats.toLocaleString()} sats
                          </Badge>
                        )}
                      </div>

                      <dl className='grid gap-2 text-sm'>
                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Order ID:
                          </dt>
                          <dd className='flex-1'>
                            <TextDialog
                              title='Order ID'
                              content={order.orderId}
                              truncateLength={16}
                            />
                          </dd>
                        </div>

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Amount:
                          </dt>
                          <dd className='flex-1 font-mono text-xs'>
                            {formatBtc(order.amountSats)} ckBTC
                          </dd>
                        </div>

                        {mintTarget && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[120px] text-muted-foreground'>
                              License Wallet:
                            </dt>
                            <dd className='flex-1'>
                              <TextDialog
                                title='License Wallet Address'
                                content={mintTarget}
                                truncateLength={20}
                              />
                            </dd>
                          </div>
                        )}

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Escrow Account:
                          </dt>
                          <dd className='flex-1'>
                            <div className='space-y-1'>
                              <TextDialog
                                title='Escrow Account Target'
                                content={order.btcAddress}
                                truncateLength={24}
                              />
                              {ckbtcEscrowPrincipal && (
                                <p className='text-xs text-muted-foreground'>
                                  Escrow principal: {ckbtcEscrowPrincipal}
                                </p>
                              )}
                              {subaccount && (
                                <TextDialog
                                  title='ckBTC Subaccount'
                                  content={subaccount}
                                  truncateLength={24}
                                />
                              )}
                              {ledgerBlock && (
                                <p className='text-xs text-muted-foreground'>
                                  Ledger block {ledgerBlock}
                                </p>
                              )}
                              {order.btcTxId && (
                                <p className='text-xs text-muted-foreground'>
                                  Settlement reference{' '}
                                  <span className='break-all font-mono text-xs'>
                                    {order.btcTxId}
                                  </span>
                                </p>
                              )}
                            </div>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Button asChild size='sm' variant='outline'>
                        <Link
                          href={`/pay/${order.orderId}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          <Share2 className='mr-2 h-4 w-4' />
                          Share Invoice
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[120px]'>Order</TableHead>
                  <TableHead className='min-w-[150px]'>IP Asset</TableHead>
                  <TableHead className='min-w-[100px]'>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='min-w-[200px]'>Escrow Account</TableHead>
                  <TableHead className='min-w-[150px]'>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderHistory.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center text-sm text-muted-foreground'
                    >
                      No invoices recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {orderHistory.map(order => {
                  const statusBadge = statusStyles(order.status)
                  const ipTitle =
                    ipTitleLookup.get(order.ipId) ?? 'Unknown IP'
                  return (
                    <TableRow key={`history-${order.orderId}`}>
                      <TableCell>
                        <TextDialog
                          title='Order ID'
                          content={order.orderId}
                          truncateLength={10}
                        />
                      </TableCell>
                      <TableCell className='max-w-[200px]'>
                        <p className='truncate text-sm' title={ipTitle}>
                          {ipTitle}
                        </p>
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {formatBtc(order.amountSats)} ckBTC
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadge.variant}
                          className={statusBadge.className}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TextDialog
                          title='Payment Address'
                          content={order.btcAddress}
                          truncateLength={16}
                        />
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                        {new Date(
                          order.updatedAt ?? order.createdAt
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Finalized Licenses</CardTitle>
          <CardDescription>
            Story license tokens, C2PA bundles, and verifiable credentials for completed sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[120px]'>Order</TableHead>
                  <TableHead className='min-w-[120px]'>IP</TableHead>
                  <TableHead className='min-w-[150px]'>Wallet</TableHead>
                  <TableHead className='min-w-[100px]'>Token</TableHead>
                  <TableHead className='min-w-[180px]'>Settlement Reference</TableHead>
                  <TableHead className='min-w-[150px]'>Constellation</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className='min-w-[150px]'>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalizedOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-center text-sm text-muted-foreground'
                    >
                      No finalized licenses yet.
                    </TableCell>
                  </TableRow>
                )}
                {finalizedOrders.map(order => {
                  const mintTarget = order.mintTo ?? order.buyer ?? null
                  const constellationLink =
                    order.constellationExplorerUrl &&
                    order.constellationExplorerUrl.length > 0
                      ? order.constellationExplorerUrl
                      : order.constellationTx
                        ? constellationExplorerUrl(
                            CONSTELLATION_NETWORK,
                            order.constellationTx
                          )
                        : null

                  return (
                    <TableRow key={order.orderId}>
                      <TableCell>
                        <TextDialog
                          title='Order ID'
                          content={order.orderId}
                          truncateLength={10}
                        />
                      </TableCell>
                      <TableCell>
                        <TextDialog
                          title='IP Asset ID'
                          content={order.ipId}
                          truncateLength={10}
                        />
                      </TableCell>
                      <TableCell>
                        {mintTarget ? (
                          <TextDialog
                            title='License Wallet'
                            content={mintTarget}
                            truncateLength={12}
                          />
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {order.tokenOnChainId ? (
                          <span className='break-all'>{order.tokenOnChainId}</span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.btcTxId ? (
                          <TextDialog
                            title='Settlement Reference'
                            content={order.btcTxId}
                            truncateLength={12}
                          />
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {constellationLink ? (
                          <Link
                            href={constellationLink}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-1 font-mono text-xs text-primary underline-offset-4 hover:underline'
                          >
                            {order.constellationTx?.slice(0, 12)}…
                            <ExternalLink className='h-3 w-3' />
                          </Link>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20'>
                          {order.complianceScore}/100
                        </Badge>
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                        {order.updatedAt
                          ? new Date(order.updatedAt).toLocaleString()
                          : new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
                  <p className='font-medium'>
                    Order {order.orderId.slice(0, 10)}…
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    License token {order.tokenOnChainId || '—'}
                  </p>
                </div>
                <Button asChild size='sm' variant='secondary'>
                  <a
                    href={archiveHref}
                    download={archiveFileName}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Download C2PA
                  </a>
                </Button>
                <Button asChild size='sm' variant='secondary'>
                  <a
                    href={vcHref}
                    download={`lexlink-license-vc-${order.orderId}.json`}
                  >
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
