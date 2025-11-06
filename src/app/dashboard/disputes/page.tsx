import Link from 'next/link'

import { ExternalLink } from 'lucide-react'

import { loadDashboardData, type DisputeRecord } from '@/app/dashboard/actions'
import { DisputeRowActions } from '@/components/app/dispute-row-actions'
import { Badge } from '@/components/ui/badge'
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
import { IPFS_GATEWAYS } from '@/lib/ipfs-gateways'
import { env } from '@/lib/env'
import {
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

const CONSTELLATION_NETWORK =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'
const STORY_NETWORK =
  (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'

export default async function DisputesPage() {
  const { ips, disputes } = await loadDashboardData()
  const ipIndex = new Map(ips.map(ip => [ip.ipId, ip.title]))

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Public dispute intake</CardTitle>
          <CardDescription>
            Reporters use the public form to flag IP assets. Share this link
            with buyers, partners, and reviewers.
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
              . Reports flow through Story’s UMA arbitration policy; once a tag
              is upheld, licensing and royalty functions pause automatically.
            </p>
            <p>
              Keep a record of evidence CIDs and share the link in buyer
              receipts or customer support templates so disputes land in this
              inbox.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Dispute Ledger</CardTitle>
          <CardDescription>
            Track UMA status and Constellation attestation for reported IP assets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {disputes.length === 0 && (
              <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center'>
                <p className='text-sm text-muted-foreground'>
                  No disputes raised yet.
                </p>
              </div>
            )}
            {disputes.map((dispute: DisputeRecord) => {
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

              const ipTitle = ipIndex.get(dispute.ipId) ?? 'Unknown IP'
              const storyExplorer = ipAssetExplorerUrl(dispute.ipId, STORY_NETWORK)
              const evidenceUrl = dispute.evidenceUri
                ? dispute.evidenceUri.startsWith('ipfs://')
                  ? `${IPFS_GATEWAYS[0]}${dispute.evidenceUri.replace('ipfs://', '')}`
                  : dispute.evidenceUri
                : null

              return (
                <div
                  key={dispute.disputeId}
                  className='rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm transition-all hover:shadow-md'
                >
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='flex-1 space-y-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='text-base font-semibold'>{ipTitle}</h3>
                        <Badge variant='outline' className='capitalize'>
                          {dispute.status}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {dispute.targetTag}
                        </Badge>
                      </div>

                      <dl className='grid gap-2 text-sm'>
                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Dispute ID:
                          </dt>
                          <dd className='flex-1'>
                            <TextDialog
                              title='Dispute ID'
                              content={dispute.disputeId}
                              truncateLength={16}
                            />
                          </dd>
                        </div>

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            IP Asset:
                          </dt>
                          <dd className='flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <TextDialog
                                title='IP Asset ID'
                                content={dispute.ipId}
                                truncateLength={20}
                              />
                              <Link
                                href={storyExplorer}
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline'
                              >
                                Story explorer
                                <ExternalLink className='h-3 w-3 flex-shrink-0' />
                              </Link>
                            </div>
                          </dd>
                        </div>

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Reporter:
                          </dt>
                          <dd className='flex-1'>
                            <TextDialog
                              title='Reporter Principal'
                              content={dispute.reporterPrincipal}
                              truncateLength={20}
                            />
                          </dd>
                        </div>

                        {dispute.evidenceNote && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[120px] text-muted-foreground'>
                              Note:
                            </dt>
                            <dd className='flex-1 text-xs leading-relaxed text-muted-foreground'>
                              {dispute.evidenceNote}
                            </dd>
                          </div>
                        )}

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Evidence:
                          </dt>
                          <dd className='flex-1'>
                            {evidenceUrl ? (
                              <Link
                                href={evidenceUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
                              >
                                {dispute.evidenceUri}
                                <ExternalLink className='h-3 w-3 flex-shrink-0' />
                              </Link>
                            ) : (
                              <TextDialog
                                title='Evidence CID'
                                content={dispute.evidenceCid}
                                truncateLength={20}
                              />
                            )}
                          </dd>
                        </div>

                        {constellationLink && dispute.constellationTx && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[120px] text-muted-foreground'>
                              Constellation:
                            </dt>
                            <dd className='flex-1'>
                              <Link
                                href={constellationLink}
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
                              >
                                {dispute.constellationTx.slice(0, 24)}…
                                <ExternalLink className='h-3 w-3 flex-shrink-0' />
                              </Link>
                            </dd>
                          </div>
                        )}

                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[120px] text-muted-foreground'>
                            Opened:
                          </dt>
                          <dd className='flex-1 text-xs text-muted-foreground'>
                            {formatDate(dispute.createdAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <DisputeRowActions
                        disputeId={dispute.disputeId}
                        status={dispute.status}
                        network={STORY_NETWORK}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
