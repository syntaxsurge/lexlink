import { loadAuditTrail } from '@/app/app/actions'
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

export default async function CompliancePage() {
  const events = await loadAuditTrail(100)

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Canonical evidence of all cross-chain actions executed inside
            LexLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No audit events recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {events.map(event => (
                <TableRow key={`${event.eventId}-${event.createdAt}`}>
                  <TableCell>
                    <Badge variant='outline'>{event.action}</Badge>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {event.resourceId ?? '—'}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {event.actorAddress ?? event.actorPrincipal ?? '—'}
                  </TableCell>
                  <TableCell>
                    <pre className='max-h-36 overflow-y-auto rounded bg-muted/40 p-2 text-[11px]'>
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {formatDate(event.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
