import Link from 'next/link'

import {
  Eye,
  Layers,
  FileText,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react'

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
import { Separator } from '@/components/ui/separator'
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

function takeMostRecent<T>(
  items: T[],
  getTimestamp: (item: T) => number | undefined,
  limit = 3
) {
  return [...items]
    .sort((a, b) => (getTimestamp(b) ?? 0) - (getTimestamp(a) ?? 0))
    .slice(0, limit)
}

const network = (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
const constellationNetwork =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

function MetricCard({
  title,
  hint,
  value,
  icon: Icon,
  gradient
}: {
  title: string
  hint: string
  value: string
  icon: React.ElementType
  gradient: string
}) {
  return (
    <Card
      className={`group relative overflow-hidden rounded-3xl border-2 border-border/60 bg-gradient-to-br ${gradient} p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
    >
      <div className='flex items-start justify-between'>
        <div className='space-y-3'>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground'>
            {title}
          </p>
          <p className='text-4xl font-bold text-foreground'>{value}</p>
          <p className='text-xs text-muted-foreground'>{hint}</p>
        </div>
        <div className='rounded-2xl bg-background/50 p-3 backdrop-blur-sm'>
          <Icon className='h-6 w-6 text-primary' />
        </div>
      </div>
    </Card>
  )
}

function EventItem({ event }: { event: AuditEventRecord }) {
  return (
    <div className='rounded-lg border border-border/60 bg-background/70 p-3 shadow-sm transition-colors hover:bg-accent/50'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
          <Badge
            variant='outline'
            className='flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs'
          >
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
            <Button
              variant='ghost'
              size='sm'
              className='h-7 flex-shrink-0 text-xs'
            >
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
                    <div className='mt-1 break-all font-mono text-xs'>
                      {event.resourceId}
                    </div>
                  </div>
                )}
                {event.actorAddress && (
                  <div>
                    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Actor Address
                    </span>
                    <div className='mt-1 break-all font-mono text-xs'>
                      {event.actorAddress}
                    </div>
                  </div>
                )}
                {event.actorPrincipal && (
                  <div>
                    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Actor Principal
                    </span>
                    <div className='mt-1 break-all font-mono text-xs'>
                      {event.actorPrincipal}
                    </div>
                  </div>
                )}
                <div>
                  <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Timestamp
                  </span>
                  <div className='mt-1 text-xs'>
                    {formatDate(event.createdAt)}
                  </div>
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
  const [{ principal, ips, licenses, disputes }, auditTrail, ckbtcSnapshot] =
    await Promise.all([
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
  const disputeInbox = disputes?.inbox ?? []
  const recentPendingOrders = takeMostRecent(
    pendingOrders,
    order => order.updatedAt ?? order.createdAt,
    3
  )
  const recentDisputes = takeMostRecent(
    disputeInbox,
    dispute => dispute.resolvedAt ?? dispute.respondedAt ?? dispute.createdAt,
    3
  )
  const recentFinalizedOrders = takeMostRecent(
    finalizedOrders,
    order => order.finalizedAt ?? order.updatedAt ?? order.createdAt,
    3
  )
  const recentAuditEvents = takeMostRecent(
    auditTrail,
    event => event.createdAt,
    3
  )
  const averageCompliance = finalizedOrders.length
    ? Math.round(
        finalizedOrders.reduce(
          (sum, license) => sum + license.complianceScore,
          0
        ) / finalizedOrders.length
      )
    : 0

  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary'
          >
            <Sparkles className='mr-2 h-3 w-3' />
            Dashboard Overview
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              Welcome Back
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              Monitor your IP assets, track license settlements, and manage
              compliance across Story Protocol and Constellation Network.
            </p>
          </div>
        </div>
      </section>

      <PrincipalSummary principal={principal} />

      {/* Metric Cards - All 3 in one row on desktop */}
      <div className='grid gap-6 md:grid-cols-3'>
        <MetricCard
          title='Registered IP Assets'
          hint='Story Protocol records mirrored in Convex'
          value={ips.length.toString()}
          icon={Layers}
          gradient='from-primary/10 via-background to-card'
        />
        <MetricCard
          title='Open Licenses'
          hint='Awaiting settlement completion'
          value={pendingOrders.length.toString()}
          icon={Clock}
          gradient='from-amber-500/10 via-background to-card'
        />
        <MetricCard
          title='Average Compliance'
          hint='Score across completed sales'
          value={`${averageCompliance}/100`}
          icon={TrendingUp}
          gradient='from-emerald-500/10 via-background to-card'
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <CkbtcBalanceCard snapshot={ckbtcSnapshot} />
        {ckbtcSnapshot.enabled ? (
          <OperatorTopUpPanel snapshot={ckbtcSnapshot} />
        ) : null}
      </div>

      <Separator className='my-8 bg-gradient-to-r from-transparent via-border to-transparent' />

      <div className='grid gap-8 lg:grid-cols-2'>
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/10 to-background p-3 shadow-lg'>
                  <Clock className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div className='space-y-1'>
                  <CardTitle className='text-xl font-bold'>
                    Pending License Payments
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    Orders awaiting settlement
                  </CardDescription>
                </div>
              </div>
              <Button
                asChild
                variant='outline'
                size='sm'
                className='flex-shrink-0 rounded-full'
              >
                <Link href='/dashboard/licenses'>Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='pt-6'>
            <div className='space-y-3'>
              {pendingOrders.length === 0 && (
                <div className='rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-8 text-center'>
                  <CheckCircle2 className='mx-auto mb-2 h-8 w-8 text-emerald-500' />
                  <p className='text-sm font-medium text-foreground'>
                    All caught up!
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    No pending invoices at the moment
                  </p>
                </div>
              )}
              {recentPendingOrders.map(order => (
                <div
                  key={order.orderId}
                  className='flex items-center justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-background/70 to-card/50 px-4 py-3 text-sm shadow-sm transition-all hover:scale-[1.01] hover:shadow-md'
                >
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    <span className='truncate font-mono text-xs font-medium'>
                      {order.orderId.slice(0, 10)}…
                    </span>
                    <Badge
                      variant='outline'
                      className='flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize'
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Button
                    asChild
                    variant='ghost'
                    size='sm'
                    className='h-8 rounded-full text-xs'
                  >
                    <Link href='/dashboard/licenses'>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-rose-500/10 to-background p-3 shadow-lg'>
                  <FileText className='h-5 w-5 text-rose-600 dark:text-rose-400' />
                </div>
                <div className='space-y-1'>
                  <CardTitle className='text-xl font-bold'>
                    Case Monitor
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    Active Story disputes
                  </CardDescription>
                </div>
              </div>
              <Button
                asChild
                variant='outline'
                size='sm'
                className='flex-shrink-0 rounded-full'
              >
                <Link href='/dashboard/disputes'>Review</Link>
              </Button>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='pt-6'>
            <div className='space-y-3'>
              {disputeInbox.length === 0 && (
                <div className='rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-8 text-center'>
                  <CheckCircle2 className='mx-auto mb-2 h-8 w-8 text-emerald-500' />
                  <p className='text-sm font-medium text-foreground'>
                    All clear!
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    No active disputes at the moment
                  </p>
                </div>
              )}
              {recentDisputes.map((dispute: DisputeRecord) => {
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
                    className='rounded-2xl border border-border/60 bg-gradient-to-br from-background/70 to-card/50 p-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md'
                  >
                    <div className='mb-3 flex items-center justify-between gap-2'>
                      <span className='truncate font-mono text-xs font-semibold'>
                        {dispute.disputeId.slice(0, 12)}…
                      </span>
                      <Badge
                        variant='outline'
                        className='flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize'
                      >
                        {dispute.status}
                      </Badge>
                    </div>
                    <div className='space-y-2 text-xs'>
                      <div>
                        <span className='text-muted-foreground'>IP: </span>
                        <span className='break-all font-mono text-[11px] font-medium'>
                          {dispute.ipId.slice(0, 20)}…
                        </span>
                      </div>
                      {disputeExplorerUrl && dispute.constellationTx && (
                        <Link
                          href={disputeExplorerUrl}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline'
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

      <Separator className='my-8 bg-gradient-to-r from-transparent via-border to-transparent' />

      <div className='grid gap-8 lg:grid-cols-2'>
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-background p-3 shadow-lg'>
                  <CheckCircle2 className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                </div>
                <div className='space-y-1'>
                  <CardTitle className='text-xl font-bold'>
                    Completed Licenses
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    Settled orders with Story license tokens
                  </CardDescription>
                </div>
              </div>
              <Button
                asChild
                variant='outline'
                size='sm'
                className='flex-shrink-0 rounded-full'
              >
                <Link href='/dashboard/licenses'>See all</Link>
              </Button>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='space-y-4 pt-6'>
            {finalizedOrders.length === 0 && (
              <div className='rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-8 text-center'>
                <p className='text-sm font-medium text-foreground'>
                  No completed licenses yet
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Finalized orders will appear here
                </p>
              </div>
            )}
            {recentFinalizedOrders.map(order => {
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
                  className='rounded-2xl border border-border/60 bg-gradient-to-br from-background/70 to-card/50 p-5 shadow-sm transition-all hover:shadow-md'
                >
                  <div className='mb-4 flex items-center justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold'>
                        Order {order.orderId.slice(0, 10)}…
                      </p>
                      <div className='mt-1 flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400'
                        >
                          Score: {order.complianceScore}/100
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <dl className='space-y-2 text-xs'>
                    <div className='rounded-lg bg-background/50 p-2'>
                      <dt className='font-medium text-muted-foreground'>
                        Settlement Reference
                      </dt>
                      <dd className='mt-1 break-all font-mono text-[11px]'>
                        {order.btcTxId}
                      </dd>
                    </div>
                    <div className='rounded-lg bg-background/50 p-2'>
                      <dt className='font-medium text-muted-foreground'>
                        Constellation Tx
                      </dt>
                      <dd className='mt-1 break-all font-mono text-[11px]'>
                        {orderExplorerUrl ? (
                          <Link
                            href={orderExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='font-medium text-primary underline-offset-4 hover:underline'
                          >
                            {order.constellationTx}
                          </Link>
                        ) : (
                          order.constellationTx || 'pending'
                        )}
                      </dd>
                    </div>
                    <div className='rounded-lg bg-background/50 p-2'>
                      <dt className='font-medium text-muted-foreground'>
                        License Token
                      </dt>
                      <dd className='mt-1 break-all font-mono text-[11px]'>
                        {order.tokenOnChainId}
                      </dd>
                    </div>
                  </dl>

                  <div className='mt-4 flex items-center gap-2'>
                    <Button
                      asChild
                      size='sm'
                      variant='outline'
                      className='flex-1 rounded-full'
                    >
                      <Link
                        href={ipAssetExplorerUrl(order.ipId, network)}
                        target='_blank'
                        rel='noreferrer'
                      >
                        IP Explorer
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size='sm'
                      variant='ghost'
                      className='flex-1 rounded-full'
                    >
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
              )
            })}
          </CardContent>
        </Card>

        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3'>
                <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
                  <Eye className='h-5 w-5 text-primary' />
                </div>
                <div className='space-y-1'>
                  <CardTitle className='text-xl font-bold'>
                    Recent Audit Activity
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    Cross-chain evidence for compliance
                  </CardDescription>
                </div>
              </div>
              <Button
                asChild
                variant='outline'
                size='sm'
                className='flex-shrink-0 rounded-full'
              >
                <Link href='/dashboard/compliance'>Open ledger</Link>
              </Button>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='space-y-3 pt-6'>
            {auditTrail.length === 0 && (
              <div className='rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-8 text-center'>
                <p className='text-sm font-medium text-foreground'>
                  No activity yet
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Audit events will appear here
                </p>
              </div>
            )}
            {recentAuditEvents.map(event => (
              <EventItem key={event.eventId} event={event} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Separator className='my-8 bg-gradient-to-r from-transparent via-border to-transparent' />

      <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
        <CardHeader className='space-y-4 pb-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
              <Layers className='h-5 w-5 text-primary' />
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Settlement History
              </CardTitle>
              <CardDescription className='text-sm'>
                Recent finalized licenses with Constellation anchors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
        <CardContent className='pt-6'>
          <div className='overflow-x-auto rounded-2xl border border-border/60 bg-background/50'>
            <Table className='min-w-full'>
              <TableHeader>
                <TableRow className='border-border/60 bg-muted/30'>
                  <TableHead className='whitespace-nowrap font-bold'>
                    Order
                  </TableHead>
                  <TableHead className='whitespace-nowrap font-bold'>
                    IP ID
                  </TableHead>
                  <TableHead className='whitespace-nowrap font-bold'>
                    Status
                  </TableHead>
                  <TableHead className='whitespace-nowrap font-bold'>
                    Constellation Tx
                  </TableHead>
                  <TableHead className='whitespace-nowrap font-bold'>
                    Score
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalizedOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='py-12 text-center text-sm text-muted-foreground'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <Layers className='h-8 w-8 text-muted-foreground/50' />
                        <p className='font-medium'>No finalized licenses yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {finalizedOrders.slice(0, 6).map(order => {
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
                    <TableRow
                      key={order.orderId}
                      className='border-border/60 transition-colors hover:bg-muted/30'
                    >
                      <TableCell className='whitespace-nowrap font-mono text-xs font-semibold'>
                        {order.orderId.slice(0, 10)}…
                      </TableCell>
                      <TableCell className='break-all font-mono text-xs'>
                        {order.ipId}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <Badge
                          variant='outline'
                          className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-700 dark:text-emerald-400'
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='break-all font-mono text-xs'>
                        {orderExplorerUrl ? (
                          <Link
                            href={orderExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='font-medium text-primary underline-offset-4 hover:underline'
                          >
                            {order.constellationTx}
                          </Link>
                        ) : (
                          <span className='text-muted-foreground'>
                            Pending anchor
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <Badge
                          variant='outline'
                          className='rounded-full px-2 py-0.5 text-xs font-semibold'
                        >
                          {order.complianceScore}/100
                        </Badge>
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
