import Link from 'next/link'

import { Eye } from 'lucide-react'

import {
  loadAuditTrail,
  loadCkbtcSnapshot,
  loadDashboardData,
  type AuditEventRecord,
  type DisputeRecord,
  type LicenseRecord
} from '@/app/dashboard/actions'
import { CkbtcBalanceCard } from '@/components/app/ckbtc-balance-card'
import { OperatorTopUpPanel } from '@/components/app/operator-topup-panel'
import { PrincipalSummary } from '@/components/app/principal-summary'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

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
        <CardTitle className='truncate text-3xl font-semibold'>
          {value}
        </CardTitle>
        <p className='text-xs text-muted-foreground/80'>{hint}</p>
      </CardHeader>
    </Card>
  )
}

function EventItem({ event }: { event: AuditEventRecord }) {
  return (
    <div className='rounded-lg border border-border/60 bg-background/70 p-3 shadow-sm transition-colors hover:bg-accent/50'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
          <Badge variant='outline' className='flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs'>
            {event.action}
          </Badge>
          {event.resourceId && (
            <span className='truncate font-mono text-xs text-muted-foreground'>
              {event.resourceId.slice(0, 20)}…
            </span>
          )}
        </div>
        <span className='flex-shrink-0 text-xs text-muted-foreground'>
          {formatDate(event.createdAt)}
        </span>
      </div>
      <div className='mt-2.5 flex items-center justify-between gap-2'>
        <div className='min-w-0 flex-1 text-xs text-muted-foreground'>
          {event.actorAddress && (
            <div className='truncate'>Actor: {event.actorAddress}</div>
          )}
          {event.actorPrincipal && (
            <div className='truncate'>Principal: {event.actorPrincipal}</div>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='ghost' size='sm' className='h-7 flex-shrink-0 text-xs'>
              <Eye className='mr-1.5 h-3.5 w-3.5' />
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl'>
            <DialogHeader>
              <DialogTitle>Audit Event Details</DialogTitle>
              <DialogDescription>
                Complete payload and metadata for {event.action}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='grid gap-3 text-sm'>
                <div>
                  <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Action
                  </span>
                  <div className='mt-1'>
                    <Badge variant='outline'>{event.action}</Badge>
                  </div>
                </div>
                {event.resourceId && (
                  <div>
                    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Resource ID
                    </span>
                    <div className='mt-1 break-all font-mono text-xs'>{event.resourceId}</div>
                  </div>
                )}
                {event.actorAddress && (
                  <div>
                    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Actor Address
                    </span>
                    <div className='mt-1 break-all font-mono text-xs'>{event.actorAddress}</div>
                  </div>
                )}
                {event.actorPrincipal && (
                  <div>
                    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Actor Principal
                    </span>
                    <div className='mt-1 break-all font-mono text-xs'>{event.actorPrincipal}</div>
                  </div>
                )}
                <div>
                  <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Timestamp
                  </span>
                  <div className='mt-1 text-xs'>{formatDate(event.createdAt)}</div>
                </div>
              </div>
              <div>
                <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Payload
                </span>
                <ScrollArea className='mt-2 h-[300px] w-full rounded-lg border border-border/60'>
                  <pre className='whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed'>
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default async function OverviewPage() {
  const [
    { principal, ips, licenses, disputes, trainingBatches },
    auditTrail,
    ckbtcSnapshot
  ] = await Promise.all([
    loadDashboardData(),
    loadAuditTrail(8),
    loadCkbtcSnapshot()
  ])

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
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardTitle className='text-lg'>Pending License Payments</CardTitle>
              <CardDescription className='text-sm'>
                Orders awaiting settlement
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm' className='flex-shrink-0'>
              <Link href='/dashboard/licenses'>Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {pendingOrders.length === 0 && (
                <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No pending invoices — great job!
                  </p>
                </div>
              )}
              {pendingOrders.slice(0, 5).map(order => (
                <div
                  key={order.orderId}
                  className='flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50'
                >
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    <span className='truncate font-mono text-xs'>
                      {order.orderId.slice(0, 10)}…
                    </span>
                    <Badge
                      variant='outline'
                      className='flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize'
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Button asChild variant='ghost' size='sm' className='h-7 text-xs'>
                    <Link href='/dashboard/licenses'>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border border-border/60 bg-card/70 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
            <div className='space-y-1'>
              <CardTitle className='text-lg'>Disputes Monitor</CardTitle>
              <CardDescription className='text-sm'>
                Active UMA disputes
              </CardDescription>
            </div>
            <Button asChild variant='outline' size='sm' className='flex-shrink-0'>
              <Link href='/dashboard/disputes'>Review</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {disputes.length === 0 && (
                <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No disputes at the moment.
                  </p>
                </div>
              )}
              {disputes.slice(0, 3).map((dispute: DisputeRecord) => {
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
                    className='rounded-lg border border-border/60 bg-background/70 p-3 transition-colors hover:bg-accent/50'
                  >
                    <div className='flex items-center justify-between gap-2 mb-2'>
                      <span className='truncate font-mono text-xs font-medium'>
                        {dispute.disputeId.slice(0, 12)}…
                      </span>
                      <Badge variant='outline' className='flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize'>
                        {dispute.status}
                      </Badge>
                    </div>
                    <div className='space-y-1.5 text-xs'>
                      <div>
                        <span className='text-muted-foreground'>IP: </span>
                        <span className='break-all font-mono text-[11px]'>
                          {dispute.ipId.slice(0, 20)}…
                        </span>
                      </div>
                      {disputeExplorerUrl && dispute.constellationTx && (
                        <Link
                          href={disputeExplorerUrl}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
                        >
                          View on Constellation
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
                      <dt className='text-muted-foreground'>
                        Settlement Reference
                      </dt>
                      <dd className='font-mono'>{order.btcTxId}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>
                        Constellation Tx
                      </dt>
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
                  <TableHead className='whitespace-nowrap'>
                    Constellation Tx
                  </TableHead>
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
