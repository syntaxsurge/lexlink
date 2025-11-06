import type { ComponentProps } from 'react'

import Link from 'next/link'

import { format } from 'date-fns'

import { loadDashboardData, type IpRecord } from '@/app/dashboard/actions'
import { RegisterIpForm } from '@/components/app/register-ip-form'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/env'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'
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

const network = (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'

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
                <TableHead>Price (BTC)</TableHead>
                <TableHead>Royalty</TableHead>
                <TableHead>Links</TableHead>
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
                    {(ip.priceSats / 100_000_000).toFixed(6)}
                  </TableCell>
                  <TableCell>{(ip.royaltyBps / 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-2'>
                      <AssetLink label='Media' href={resolveMediaUrl(ip.mediaUrl)} />
                      <AssetLink
                        label='IP Metadata'
                        href={resolveMediaUrl(ip.ipMetadataUri)}
                        variant='outline'
                      />
                      <AssetLink
                        label='NFT Metadata'
                        href={resolveMediaUrl(ip.nftMetadataUri)}
                        variant='outline'
                      />
                      <AssetLink
                        label='Story IP Explorer'
                        href={ipAssetExplorerUrl(ip.ipId, network)}
                        variant='outline'
                      />
                      <AssetLink
                        label='StoryScan (address)'
                        href={ipAccountOnBlockExplorer(ip.ipId, network)}
                        variant='outline'
                      />
                    </div>
                  </TableCell>
                  <TableCell>{format(ip.createdAt, 'PPpp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

type AssetLinkProps = {
  label: string
  href: string
  variant?: ComponentProps<typeof Badge>['variant']
}

function AssetLink({ label, href, variant }: AssetLinkProps) {
  return (
    <Badge asChild variant={variant}>
      <Link href={href} target='_blank' rel='noreferrer'>
        {label}
      </Link>
    </Badge>
  )
}

function resolveMediaUrl(url: string) {
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`
  }
  try {
    const parsed = new URL(url)
    if (parsed.pathname.includes('/ipfs/')) {
      return `https://ipfs.io${parsed.pathname}`
    }
    return parsed.toString()
  } catch {
    return `https://ipfs.io/ipfs/${url}`
  }
}
