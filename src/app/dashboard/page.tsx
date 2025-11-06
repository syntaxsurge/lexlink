import Link from 'next/link'

import {
  loadAuditTrail,
  loadCkbtcSnapshot,
  loadDashboardData,
  type AuditEventRecord,
  type DisputeRecord,
  type LicenseRecord
} from '@/app/dashboard/actions'
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
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'
import { CkbtcBalanceCard } from '@/components/app/ckbtc-balance-card'
import { OperatorTopUpPanel } from '@/components/app/operator-topup-panel'
import { PrincipalSummary } from '@/components/app/principal-summary'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

const network = (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
const constellationNetwork =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

function MetricCard({
  title,
  hint,
  value
}: {
  title: string
  hint: string
  value: string
}) {
  return (
    <Card className='overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background text-foreground shadow'>
      <CardHeader className='space-y-3'>
        <CardDescription className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {title}
        </CardDescription>
        <CardTitle className='truncate text-3xl font-semibold'>{value}</CardTitle>
        <p className='text-xs text-muted-foreground/80'>{hint}</p>
      </CardHeader>
    </Card>
  )
}

function EventItem({ event }: { event: AuditEventRecord }) {
  return (
    <div className='rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm text-sm'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
            {event.action}
          </Badge>
          {event.resourceId && (
            <span className='break-all font-mono text-xs text-muted-foreground'>
              {event.resourceId}
            </span>
          )}
        </div>
        <span className='text-xs text-muted-foreground'>
          {formatDate(event.createdAt)}
        </span>
      </div>
      <div className='mt-3 grid gap-1 text-xs text-muted-foreground'>
        {event.actorAddress && <div>Actor: {event.actorAddress}</div>}
        {event.actorPrincipal && <div>Principal: {event.actorPrincipal}</div>}
        <pre className='mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 font-mono text-[11px] text-foreground'>
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default async function OverviewPage() {
  const [
    { principal, ips, licenses, disputes, trainingBatches },
    auditTrail,
    ckbtcSnapshot
  ] =
    await Promise.all([loadDashboardData(), loadAuditTrail(8), loadCkbtcSnapshot()])

  const pendingOrders = licenses.filter((license: LicenseRecord) =>
    ['pending', 'funded', 'confirmed'].includes(license.status)
  )
  const finalizedOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'finalized'
  )
  const averageCompliance = finalizedOrders.length
    ? Math.round(
        finalizedOrders.reduce(
          (sum, license) => sum + license.complianceScore,
          0
        ) / finalizedOrders.length
      )
    : 0
  const totalTrainingUnits = licenses.reduce(
    (sum, license) => sum + (license.trainingUnits ?? 0),
    0
  )

  return (
    <div className='space-y-8'>
      <PrincipalSummary principal={principal} />
      <div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-4'>
        <MetricCard
          title='Registered IP Assets'
          hint='Story Protocol records mirrored in Convex'
          value={ips.length.toString()}
        />
        <MetricCard
          title='Open Licenses'
          hint='Awaiting settlement completion'
          value={pendingOrders.length.toString()}
        />
        <MetricCard
          title='Average Compliance'
          hint='Score across completed sales'
          value={`${averageCompliance}/100`}
        />
        <MetricCard
          title='Training Units Logged'
          hint='Constellation-evidenced AI batches'
          value={totalTrainingUnits.toLocaleString()}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <CkbtcBalanceCard snapshot={ckbtcSnapshot} />
        {ckbtcSnapshot.enabled ? (
          <OperatorTopUpPanel snapshot={ckbtcSnapshot} />
        ) : null}
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Pending License Payments</CardTitle>
              <CardDescription>
                Orders waiting for ckBTC minting or Bitcoin confirmations. Click through to the
                Licenses page for full controls.
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/licenses'>Manage orders</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table className='min-w-full'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='whitespace-nowrap'>Order</TableHead>
                    <TableHead className='whitespace-nowrap'>IP</TableHead>
                    <TableHead className='whitespace-nowrap'>Buyer</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-center text-sm text-muted-foreground'
                      >
                        No pending invoices — great job!
                      </TableCell>
                    </TableRow>
                  )}
                  {pendingOrders.map(order => (
                    <TableRow key={order.orderId}>
                      <TableCell className='whitespace-nowrap font-medium'>
                        {order.orderId.slice(0, 8)}…
                      </TableCell>
                      <TableCell className='whitespace-nowrap font-mono text-xs'>
                        {order.ipId.slice(0, 10)}…
                      </TableCell>
                      <TableCell className='whitespace-nowrap font-mono text-xs'>
                        {(order.mintTo ?? order.buyer ?? 'pending').slice(0, 10)}…
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <Badge variant='outline' className='rounded-full px-2 py-0.5 text-xs capitalize'>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Disputes Monitor</CardTitle>
              <CardDescription>
                Active UMA-backed disputes on Story.
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/disputes'>Review disputes</Link>
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            {disputes.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                No disputes at the moment.
              </p>
            )}
            {disputes.slice(0, 4).map((dispute: DisputeRecord) => {
              const disputeExplorerUrl =
                dispute.constellationExplorerUrl &&
                dispute.constellationExplorerUrl.length > 0
                  ? dispute.constellationExplorerUrl
                  : dispute.constellationTx
                    ? constellationExplorerUrl(
                        constellationNetwork,
                        dispute.constellationTx
                      )
                    : null
              return (
                <div
                  key={dispute.disputeId}
                  className='rounded-xl border border-border/60 bg-background/70 p-4'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-medium'>
                      {dispute.disputeId.slice(0, 10)}…
                    </span>
                    <Badge className='rounded-full px-2 py-0.5 capitalize'>{dispute.status}</Badge>
                  </div>
                  <dl className='mt-3 grid gap-3 text-xs'>
                    <div className='space-y-1'>
                      <dt className='text-muted-foreground'>IP ID</dt>
                      <dd className='break-words font-mono text-[11px]'>{dispute.ipId}</dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-muted-foreground'>Evidence CID</dt>
                      <dd className='break-all font-mono text-[11px]'>{dispute.evidenceCid}</dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-muted-foreground'>Constellation Tx</dt>
                      <dd className='break-all font-mono text-[11px]'>
                        {disputeExplorerUrl ? (
                          <Link
                            href={disputeExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary underline-offset-4 hover:underline'
                          >
                            {dispute.constellationTx}
                          </Link>
                        ) : (
                          dispute.constellationTx || 'pending'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Completed Licenses</CardTitle>
              <CardDescription>
                Settled orders with Story license tokens and Constellation
                proofs.
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/licenses'>See all</Link>
            </Button>
          </CardHeader>
          <CardContent className='space-y-4'>
            {finalizedOrders.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                No completed licenses yet.
              </p>
            )}
            {finalizedOrders.slice(0, 3).map(order => {
              const orderExplorerUrl =
                order.constellationExplorerUrl &&
                order.constellationExplorerUrl.length > 0
                  ? order.constellationExplorerUrl
                  : order.constellationTx
                    ? constellationExplorerUrl(
                        constellationNetwork,
                        order.constellationTx
                      )
                    : null

              return (
                <div
                  key={order.orderId}
                  className='rounded-xl border border-border/60 bg-background/70 p-4'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-medium'>
                        Order {order.orderId.slice(0, 10)}…
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Compliance score {order.complianceScore}/100
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button asChild size='sm' variant='outline'>
                        <Link
                          href={ipAssetExplorerUrl(order.ipId, network)}
                          target='_blank'
                          rel='noreferrer'
                        >
                          View IP Explorer
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

                  <dl className='mt-3 grid gap-1 text-xs'>
                    <div>
                      <dt className='text-muted-foreground'>Bitcoin Tx</dt>
                      <dd className='font-mono'>{order.btcTxId}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Constellation Tx</dt>
                      <dd className='font-mono'>
                        {orderExplorerUrl ? (
                          <Link
                            href={orderExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary underline-offset-4 hover:underline'
                          >
                            {order.constellationTx}
                          </Link>
                        ) : (
                          order.constellationTx || 'pending'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>License Token</dt>
                      <dd className='font-mono'>{order.tokenOnChainId}</dd>
                    </div>
                  </dl>
                </div>
              )
            })}

          </CardContent>
        </Card>

        <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Recent Audit Activity</CardTitle>
              <CardDescription>
                Cross-chain evidence recorded for compliance.
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/compliance'>Open ledger</Link>
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            {auditTrail.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                No activity recorded.
              </p>
            )}
            {auditTrail.map(event => (
              <EventItem key={event.eventId} event={event} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Training Meter Activity</CardTitle>
            <CardDescription>
              Constellation IntegrationNet heartbeats emitted for AI usage.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table className='min-w-full'>
              <TableHeader>
                <TableRow>
                  <TableHead className='whitespace-nowrap'>Batch</TableHead>
                  <TableHead className='whitespace-nowrap'>IP ID</TableHead>
                  <TableHead className='whitespace-nowrap'>Units</TableHead>
                  <TableHead className='whitespace-nowrap'>Constellation Tx</TableHead>
                  <TableHead className='whitespace-nowrap'>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingBatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center text-sm text-muted-foreground'
                    >
                      No training batches recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {trainingBatches.slice(0, 6).map(batch => {
                  const batchExplorerUrl =
                    batch.constellationExplorerUrl &&
                    batch.constellationExplorerUrl.length > 0
                      ? batch.constellationExplorerUrl
                      : batch.constellationTx
                        ? constellationExplorerUrl(
                            constellationNetwork,
                            batch.constellationTx
                          )
                        : null
                  return (
                    <TableRow key={batch.batchId}>
                      <TableCell className='whitespace-nowrap font-medium'>
                        {batch.batchId.slice(0, 10)}…
                      </TableCell>
                      <TableCell className='break-all font-mono text-xs'>
                        {batch.ipId}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {batch.units.toLocaleString()}
                      </TableCell>
                      <TableCell className='break-all font-mono text-xs'>
                        {batchExplorerUrl ? (
                          <Link
                            href={batchExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary underline-offset-4 hover:underline'
                          >
                            {batch.constellationTx}
                          </Link>
                        ) : (
                          batch.constellationTx || 'pending'
                        )}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {formatDate(batch.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
