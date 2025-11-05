import { Buffer } from 'node:buffer'

import Link from 'next/link'

import { loadDashboardData, type LicenseRecord } from '@/app/app/actions'
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
import { env } from '@/lib/env'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

const network = (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
const INTEGRATIONNET_EXPLORER =
  'https://explorer.mainnet.constellationnetwork.io/transactions/'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

export default async function LicensesPage() {
  const { ips, licenses } = await loadDashboardData()
  const awaitingOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'awaiting_payment'
  )
  const completedOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'completed'
  )

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Generate Bitcoin License Order</CardTitle>
            <CardDescription>
              Allocates an ICP escrow deposit address for the buyer and stores
              the pending order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LicenseOrderForm ips={ips} />
          </CardContent>
        </Card>
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Finalize Sale &amp; Mint License</CardTitle>
            <CardDescription>
              Confirms the Bitcoin transaction, mints a Story license token, and
              anchors Constellation evidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinalizeLicenseForm orders={awaitingOrders} />
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Completed Licenses</CardTitle>
          <CardDescription>
            Every finalized sale with Story, ICP, and Constellation references.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>IP ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>License Token</TableHead>
                <TableHead>Bitcoin Tx</TableHead>
                <TableHead>Constellation Tx</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No completed licenses yet.
                  </TableCell>
                </TableRow>
              )}
              {completedOrders.map(order => (
                <TableRow key={order.orderId}>
                  <TableCell className='font-medium'>
                    {order.orderId.slice(0, 10)}…
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    <div className='flex flex-col gap-1'>
                      <span className='break-all text-xs text-muted-foreground'>
                        {order.ipId}
                      </span>
                      <Link
                        href={ipAssetExplorerUrl(order.ipId, network)}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary underline-offset-4 hover:underline'
                      >
                        Story IP Explorer
                      </Link>
                      <Link
                        href={ipAccountOnBlockExplorer(order.ipId, network)}
                        target='_blank'
                        rel='noreferrer'
                        className='text-xs text-muted-foreground underline-offset-4 hover:underline'
                      >
                        StoryScan address
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {order.buyer}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {order.tokenOnChainId}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    <Link
                      href={`https://mempool.space/testnet/tx/${order.btcTxId}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      {order.btcTxId.slice(0, 14)}…
                    </Link>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    <Link
                      href={`${INTEGRATIONNET_EXPLORER}${order.constellationTx}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      {order.constellationTx.slice(0, 14)}…
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge>{order.complianceScore}/100</Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Completed Evidence Bundles</CardTitle>
          <CardDescription>
            Downloadable C2PA archives and verifiable credentials for downstream
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {completedOrders.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No bundles generated yet.
            </p>
          )}
          {completedOrders.map(order => {
            const c2paHref = order.c2paArchive
              ? `data:application/zip;base64,${order.c2paArchive}`
              : null
            const vcHref = order.vcDocument
              ? `data:application/json;base64,${Buffer.from(
                  order.vcDocument,
                  'utf-8'
                ).toString('base64')}`
              : null
            return (
              <div
                key={order.orderId}
                className='rounded-lg border border-border bg-background/60 p-4'
              >
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-medium'>
                      Order {order.orderId.slice(0, 10)}…
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Story IP ID {order.ipId}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button asChild size='sm' variant='outline'>
                      <Link
                        href={ipAssetExplorerUrl(order.ipId, network)}
                        target='_blank'
                        rel='noreferrer'
                      >
                        Story IP Explorer
                      </Link>
                    </Button>
                    <Button asChild size='sm' variant='ghost'>
                      <Link
                        href={ipAccountOnBlockExplorer(order.ipId, network)}
                        target='_blank'
                        rel='noreferrer'
                      >
                        StoryScan
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className='mt-3 flex flex-wrap gap-2 text-xs'>
                  {c2paHref && (
                    <Button asChild size='sm' variant='secondary'>
                      <a
                        href={c2paHref}
                        download={`lexlink-license-${order.orderId}.zip`}
                      >
                        Download C2PA
                      </a>
                    </Button>
                  )}
                  {vcHref && (
                    <Button asChild size='sm' variant='secondary'>
                      <a
                        href={vcHref}
                        download={`lexlink-vc-${order.orderId}.json`}
                      >
                        Download VC
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
