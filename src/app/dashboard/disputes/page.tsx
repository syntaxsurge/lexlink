import Link from 'next/link'
import { ReactNode } from 'react'

import { ExternalLink, ShieldAlert } from 'lucide-react'

import { loadDashboardData, type DisputeRecord } from '@/app/dashboard/actions'
import { CaseActions } from '@/components/app/case-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextDialog } from '@/components/ui/text-dialog'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'
import { IPFS_GATEWAYS } from '@/lib/ipfs-gateways'
import {
  ipAssetExplorerUrl,
  storyScanBase,
  type StoryNetwork
} from '@/lib/story-links'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

const CONSTELLATION_NETWORK =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'
const STORY_NETWORK =
  (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'

type CasesPageProps = {
  searchParams?: Promise<{
    tab?: string
  }>
}

export default async function DisputesPage({ searchParams }: CasesPageProps) {
  const { principal, ips, disputes } = await loadDashboardData()
  const params = searchParams ? await searchParams : undefined
  const ipIndex = new Map(ips.map(ip => [ip.ipId, ip.title]))

  const tabs = [
    {
      id: 'inbox',
      label: 'Inbox',
      description: 'Filed against your IP assets',
      cases: disputes?.inbox ?? []
    },
    {
      id: 'filed',
      label: 'Filed by me',
      description: 'Cases you opened as the reporter',
      cases: disputes?.filed ?? []
    },
    {
      id: 'watching',
      label: 'Watching',
      description: 'Cases you are monitoring',
      cases: disputes?.watching ?? []
    }
  ]

  const requestedTab = params?.tab
  const defaultTab =
    tabs.find(tab => tab.id === requestedTab && tab.cases.length > 0)?.id ||
    tabs.find(tab => tab.cases.length > 0)?.id ||
    'inbox'

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold'>Case Manager</h1>
          <p className='text-sm text-muted-foreground'>
            Independent reporters raise disputes through Story’s UMA-backed
            arbitration policy. Respond with evidence, monitor deadlines, and
            settle tagged assets once liveness expires.
          </p>
        </div>
        <Button asChild>
          <Link href='/report'>Report misuse</Link>
        </Button>
      </div>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Public intake</CardTitle>
          <CardDescription>
            Share the public form so reporters can submit immutable evidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground'>
            <p>
              Anyone signed in with Internet Identity can submit evidence at{' '}
              <Link
                href='/report'
                className='text-primary underline-offset-4 hover:underline'
              >
                /report
              </Link>
              . All uploads are bundled to IPFS before Story&apos;s Dispute
              Module forwards them to UMA&apos;s Optimistic Oracle.
            </p>
            <p>
              Include that link inside order receipts so customers can escalate
              issues without needing operator support.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab}>
        <TabsList className='gap-2 overflow-x-auto'>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className='capitalize'>
              {tab.label}
              <Badge variant='outline' className='ml-2 bg-muted/40'>
                {tab.cases.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card className='border-border/60 bg-card/60'>
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {tab.cases.length === 0 ? (
                  <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground'>
                    No cases in this queue yet.
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {tab.cases.map(dispute => (
                      <CaseCard
                        key={dispute.disputeId}
                        dispute={dispute}
                        ipTitle={ipIndex.get(dispute.ipId)}
                        principal={principal}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CaseCard({
  dispute,
  ipTitle,
  principal
}: {
  dispute: DisputeRecord
  ipTitle?: string
  principal: string
}) {
  const constellationLink =
    dispute.constellationExplorerUrl &&
    dispute.constellationExplorerUrl.length > 0
      ? dispute.constellationExplorerUrl
      : dispute.constellationTx
        ? constellationExplorerUrl(
            CONSTELLATION_NETWORK,
            dispute.constellationTx
          )
        : null

  const storyExplorer = ipAssetExplorerUrl(dispute.ipId, STORY_NETWORK)
  const evidenceUrl = resolveIpfs(dispute.evidenceUri)
  const responseEvidenceUrl = resolveIpfs(dispute.responseEvidenceUri)
  const deadline =
    dispute.livenessDeadline ??
    (dispute.createdAt
      ? dispute.createdAt + dispute.livenessSeconds * 1000
      : undefined)
  const livenessLabel = formatLiveness(deadline)

  return (
    <div className='rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm transition-all hover:shadow-md'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='text-base font-semibold'>
              {ipTitle ?? 'Unlabelled IP'}
            </h3>
            <Badge variant='outline' className='capitalize'>
              {dispute.status}
            </Badge>
            <Badge variant='outline' className='text-xs'>
              {dispute.targetTag}
            </Badge>
            {deadline && (
              <Badge
                variant='outline'
                className='flex items-center gap-1 text-[11px] uppercase tracking-wide'
              >
                <ShieldAlert className='h-3 w-3' />
                {livenessLabel}
              </Badge>
            )}
          </div>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <TextDialog
              title='Dispute ID'
              content={dispute.disputeId}
              truncateLength={18}
            />
            <span aria-hidden='true'>•</span>
            <TextDialog
              title='IP Asset ID'
              content={dispute.ipId}
              truncateLength={18}
            />
            <Link
              href={storyExplorer}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
            >
              View on Story
              <ExternalLink className='h-3 w-3 flex-shrink-0' />
            </Link>
          </div>
        </div>
        <div className='text-right text-xs text-muted-foreground'>
          <div>Filed: {formatDate(dispute.createdAt)}</div>
          {deadline && <div>Liveness ends: {formatDate(deadline)}</div>}
        </div>
      </div>

      <dl className='mt-4 grid gap-3 text-sm md:grid-cols-2'>
        <DataRow label='Reporter'>
          <TextDialog
            title='Reporter Principal'
            content={dispute.reporterPrincipal}
            truncateLength={20}
          />
        </DataRow>
        {dispute.ownerPrincipal && (
          <DataRow label='Owner'>
            <TextDialog
              title='Owner Principal'
              content={dispute.ownerPrincipal}
              truncateLength={20}
            />
          </DataRow>
        )}
        <DataRow label='Evidence'>
          {evidenceUrl ? (
            <Link
              href={evidenceUrl}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
            >
              {dispute.evidenceUri ?? dispute.evidenceCid}
              <ExternalLink className='h-3 w-3 flex-shrink-0' />
            </Link>
          ) : (
            <TextDialog
              title='Evidence CID'
              content={dispute.evidenceCid}
              truncateLength={20}
            />
          )}
        </DataRow>
        <DataRow label='Counter evidence'>
          {dispute.responseEvidenceCid ? (
            responseEvidenceUrl ? (
              <Link
                href={responseEvidenceUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
              >
                {dispute.responseEvidenceUri ?? dispute.responseEvidenceCid}
                <ExternalLink className='h-3 w-3 flex-shrink-0' />
              </Link>
            ) : (
              <TextDialog
                title='Counter evidence CID'
                content={dispute.responseEvidenceCid}
                truncateLength={20}
              />
            )
          ) : (
            <span className='text-xs text-muted-foreground'>
              Awaiting owner response
            </span>
          )}
        </DataRow>
        <DataRow label='Reporter bond'>
          {formatBond(dispute.reporterBond ?? dispute.bond)}
        </DataRow>
        <DataRow label='Counter bond'>
          {dispute.counterBond ? formatBond(dispute.counterBond) : '—'}
        </DataRow>
        {constellationLink && dispute.constellationTx && (
          <DataRow label='Constellation'>
            <Link
              href={constellationLink}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
            >
              {dispute.constellationTx.slice(0, 24)}…
              <ExternalLink className='h-3 w-3 flex-shrink-0' />
            </Link>
          </DataRow>
        )}
        {dispute.responseTxHash && (
          <DataRow label='Response tx'>
            <Link
              href={`${storyScanBase(STORY_NETWORK)}/tx/${dispute.responseTxHash}`}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
            >
              {dispute.responseTxHash}
              <ExternalLink className='h-3 w-3 flex-shrink-0' />
            </Link>
          </DataRow>
        )}
        {dispute.resolutionTx && (
          <DataRow label='Settlement tx'>
            <TextDialog
              title='Settlement transaction hash'
              content={dispute.resolutionTx}
              truncateLength={24}
            />
          </DataRow>
        )}
      </dl>

      <div className='mt-4'>
        <CaseActions
          disputeId={dispute.disputeId}
          principal={principal}
          ownerPrincipal={dispute.ownerPrincipal}
          reporterPrincipal={dispute.reporterPrincipal}
          watchers={dispute.watchers}
          status={dispute.status}
          respondedAt={dispute.respondedAt}
          resolvedAt={dispute.resolvedAt}
          livenessDeadline={deadline}
        />
      </div>
    </div>
  )
}

function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex items-start gap-2'>
      <dt className='min-w-[120px] text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </dt>
      <dd className='flex-1 text-sm text-foreground'>{children}</dd>
    </div>
  )
}

function resolveIpfs(uri?: string | null) {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAYS[0]}${uri.replace('ipfs://', '')}`
  }
  return uri
}

function formatLiveness(deadline?: number) {
  if (!deadline) return 'Liveness pending'
  const now = Date.now()
  const diff = deadline - now
  const abs = Math.abs(diff)
  const hours = Math.round(abs / (1000 * 60 * 60))
  if (diff > 0) {
    return hours <= 0 ? 'Expiring soon' : `~${hours}h left`
  }
  return hours <= 0 ? 'Ready to settle' : `Expired ${hours}h ago`
}

function formatBond(value?: number | null) {
  if (value === undefined || value === null) {
    return '—'
  }
  return `${value.toLocaleString()} WIP`
}
