'use client'

import { useState } from 'react'

import { Eye, MoreHorizontal } from 'lucide-react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
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

type AuditEvent = {
  eventId: string
  action: string
  resourceId?: string | null
  actorAddress?: string | null
  actorPrincipal?: string | null
  payload: any
  createdAt: number
}

function EventActionsMenu({ event }: { event: AuditEvent }) {
  const [payloadOpen, setPayloadOpen] = useState(false)
  const [resourceOpen, setResourceOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setPayloadOpen(true)}>
            <Eye className='mr-2 h-4 w-4' />
            View Payload
          </DropdownMenuItem>
          {event.resourceId && (
            <DropdownMenuItem onSelect={() => setResourceOpen(true)}>
              <Eye className='mr-2 h-4 w-4' />
              View Resource
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={payloadOpen} onOpenChange={setPayloadOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Event Payload</DialogTitle>
            <DialogDescription>
              Complete payload data for {event.action}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='h-[400px] w-full rounded-lg border border-border/60'>
            <pre className='whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed'>
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {event.resourceId && (
        <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Resource Details</DialogTitle>
              <DialogDescription>
                Resource ID associated with this event
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-3'>
              <div>
                <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Resource ID
                </span>
                <p className='mt-2 break-all rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-xs'>
                  {event.resourceId}
                </p>
              </div>
              {event.actorAddress && (
                <div>
                  <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Actor Address
                  </span>
                  <p className='mt-2 break-all rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-xs'>
                    {event.actorAddress}
                  </p>
                </div>
              )}
              {event.actorPrincipal && (
                <div>
                  <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                    Actor Principal
                  </span>
                  <p className='mt-2 break-all rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-xs'>
                    {event.actorPrincipal}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

type CompliancePageProps = {
  events: AuditEvent[]
}

function CompliancePageClient({ events }: CompliancePageProps) {
  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Canonical evidence of all cross-chain actions executed inside LexLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[140px]'>Event</TableHead>
                  <TableHead className='min-w-[180px]'>Actor</TableHead>
                  <TableHead className='min-w-[150px]'>Timestamp</TableHead>
                  <TableHead className='w-[80px] text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-center text-sm text-muted-foreground'
                    >
                      No audit events recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {events.map(event => (
                  <TableRow key={`${event.eventId}-${event.createdAt}`}>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <Badge variant='outline' className='w-fit text-xs'>
                          {event.action}
                        </Badge>
                        {event.resourceId && (
                          <span className='truncate font-mono text-xs text-muted-foreground'>
                            {event.resourceId.slice(0, 16)}…
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='max-w-[200px] truncate text-xs text-muted-foreground'>
                        {event.actorAddress ?? event.actorPrincipal ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-xs text-muted-foreground'>
                      {formatDate(event.createdAt)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <EventActionsMenu event={event} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function CompliancePage() {
  const { loadAuditTrail } = await import('@/app/dashboard/actions')
  const events = await loadAuditTrail(100)
  return <CompliancePageClient events={events} />
}
