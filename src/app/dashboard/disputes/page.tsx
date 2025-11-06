import Link from 'next/link'

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
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

const CONSTELLATION_NETWORK =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'
const STORY_NETWORK = env.NEXT_PUBLIC_STORY_NETWORK ?? 'aeneid'

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
            Track UMA status and Constellation attestation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Evidence CID</TableHead>
                <TableHead>Constellation Tx</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='w-[180px]'>Actions</TableHead>
                <TableHead>Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No disputes raised yet.
                  </TableCell>
                </TableRow>
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

                return (
                  <TableRow key={dispute.disputeId}>
                    <TableCell className='font-medium'>
                      {dispute.disputeId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='text-sm'>
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {ipIndex.get(dispute.ipId) ?? 'Unknown IP'}
                        </span>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {dispute.ipId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{dispute.targetTag}</TableCell>
                    <TableCell className='font-mono text-xs'>
                      {dispute.evidenceCid}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {constellationLink ? (
                        <Link
                          href={constellationLink}
                          target='_blank'
                          rel='noreferrer'
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          {dispute.constellationTx}
                        </Link>
                      ) : (
                        dispute.constellationTx || 'pending'
                      )}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {dispute.reporterPrincipal}
                    </TableCell>
                    <TableCell>
                      <Badge>{dispute.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DisputeRowActions
                        disputeId={dispute.disputeId}
                        status={dispute.status}
                        network={STORY_NETWORK}
                      />
                    </TableCell>
                    <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
