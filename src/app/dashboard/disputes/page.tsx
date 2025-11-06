import { loadDashboardData, type DisputeRecord } from '@/app/dashboard/actions'
import { DisputeForm } from '@/components/app/dispute-form'
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

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

export default async function DisputesPage() {
  const { ips, disputes } = await loadDashboardData()

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Raise Story Dispute</CardTitle>
          <CardDescription>
            File an UMA-backed dispute referencing an IP asset and evidence CID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisputeForm ips={ips} />
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
                <TableHead>IP ID</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Evidence CID</TableHead>
                <TableHead>Constellation Tx</TableHead>
                <TableHead>Status</TableHead>
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
              {disputes.map((dispute: DisputeRecord) => (
                <TableRow key={dispute.disputeId}>
                  <TableCell className='font-medium'>
                    {dispute.disputeId.slice(0, 10)}…
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {dispute.ipId}
                  </TableCell>
                  <TableCell>{dispute.targetTag}</TableCell>
                  <TableCell className='font-mono text-xs'>
                    {dispute.evidenceCid}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {dispute.constellationTx || 'pending'}
                  </TableCell>
                  <TableCell>
                    <Badge>{dispute.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
