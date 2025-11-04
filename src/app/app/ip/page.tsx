import Link from 'next/link'

import { loadDashboardData, type IpRecord } from '@/app/app/actions'
import { RegisterIpForm } from '@/components/app/register-ip-form'
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

const STORY_EXPLORER_BASE = 'https://aeneid.storyscan.io/ipa/'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

export default async function IpRegistryPage() {
  const { ips } = await loadDashboardData()

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-[1.1fr_1fr]'>
        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Register Story IP Asset</CardTitle>
            <CardDescription>
              Mint an SPG NFT, attach PIL terms, and mirror the asset into
              Convex.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterIpForm />
          </CardContent>
        </Card>

        <Card className='border-border/60 bg-card/60'>
          <CardHeader>
            <CardTitle>Catalogue Summary</CardTitle>
            <CardDescription>
              Snapshot of registrations synced from Story Protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='rounded-lg border border-border bg-background/60 p-4'>
              <p className='text-xs uppercase text-muted-foreground'>
                Total IP Assets
              </p>
              <p className='mt-1 text-3xl font-semibold'>{ips.length}</p>
            </div>
            <p className='text-sm text-muted-foreground'>
              Each registration automatically links the PIL URI, Story SPG token
              ID, and metadata bundle.
            </p>
            <Link
              href='https://docs.storyprotocol.xyz/docs/spg'
              target='_blank'
              rel='noreferrer'
              className='text-sm font-medium text-primary hover:underline'
            >
              View Story Protocol guide →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Registered IP Assets</CardTitle>
          <CardDescription>
            Filtered view of everything your operators have registered so far.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>IP ID</TableHead>
                <TableHead>Price (sats)</TableHead>
                <TableHead>Royalty</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ips.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No IP assets registered yet.
                  </TableCell>
                </TableRow>
              )}
              {ips.map((ip: IpRecord) => (
                <TableRow key={ip.ipId}>
                  <TableCell className='font-medium'>{ip.title}</TableCell>
                  <TableCell className='font-mono text-xs'>{ip.ipId}</TableCell>
                  <TableCell>
                    {Intl.NumberFormat('en-US').format(ip.priceSats)}
                  </TableCell>
                  <TableCell>{(ip.royaltyBps / 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-2'>
                      <Badge asChild>
                        <Link
                          href={ip.mediaUrl}
                          target='_blank'
                          rel='noreferrer'
                        >
                          Media
                        </Link>
                      </Badge>
                      <Badge asChild variant='outline'>
                        <Link
                          href={ip.ipMetadataUri}
                          target='_blank'
                          rel='noreferrer'
                        >
                          IP Metadata
                        </Link>
                      </Badge>
                      <Badge asChild variant='outline'>
                        <Link
                          href={`${STORY_EXPLORER_BASE}${ip.ipId}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          StoryScan
                        </Link>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(ip.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
