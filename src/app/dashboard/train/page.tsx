import Link from 'next/link'

import { loadDashboardData } from '@/app/dashboard/actions'
import { TrainingForm } from '@/components/app/training-form'
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

const INTEGRATIONNET_EXPLORER =
  'https://explorer.mainnet.constellationnetwork.io/transactions/'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

export default async function TrainingPage() {
  const { ips, trainingBatches } = await loadDashboardData()

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Log Training Batch</CardTitle>
          <CardDescription>
            Emit an IntegrationNet heartbeat and record usage against a specific
            IP asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingForm ips={ips} />
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Training Ledger</CardTitle>
          <CardDescription>
            Every batch increment contributes to the license compliance score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>IP ID</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Evidence Hash</TableHead>
                <TableHead>Constellation Tx</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingBatches.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No training evidence logged yet.
                  </TableCell>
                </TableRow>
              )}
              {trainingBatches.map(batch => (
                <TableRow key={batch.batchId}>
                  <TableCell className='font-medium'>
                    {batch.batchId.slice(0, 10)}…
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {batch.ipId}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {batch.units.toLocaleString()} units
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {batch.evidenceHash}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    <Link
                      href={`${INTEGRATIONNET_EXPLORER}${batch.constellationTx}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      {batch.constellationTx.slice(0, 14)}…
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(batch.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
