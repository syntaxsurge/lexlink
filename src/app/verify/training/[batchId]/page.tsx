import Link from 'next/link'
import { notFound } from 'next/navigation'

import { loadTrainingReceipt } from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { env } from '@/lib/env'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { ipAssetExplorerUrl, type StoryNetwork } from '@/lib/story-links'

type VerifyTrainingParams = {
  params: Promise<{ batchId: string }>
}

export default async function VerifyTrainingPage({
  params
}: VerifyTrainingParams) {
  const { batchId } = await params
  const record = await loadTrainingReceipt(batchId)

  if (!record) {
    notFound()
  }

  const storyNetwork =
    (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
  const constellationNetwork =
    (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'
  const constellationLink = record.constellationTx
    ? constellationExplorerUrl(constellationNetwork, record.constellationTx)
    : null

  let payloadJson: string | null = null
  if (record.payload) {
    try {
      payloadJson = JSON.stringify(JSON.parse(record.payload), null, 2)
    } catch {
      payloadJson = record.payload
    }
  }

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10'>
      <header className='space-y-2 text-center'>
        <Badge variant='outline'>Training ledger proof</Badge>
        <h1 className='text-3xl font-semibold tracking-tight'>
          Batch {batchId.slice(0, 10)}…
        </h1>
        <p className='text-sm text-muted-foreground'>
          Evidence of AI training access for {record.ipTitle}.
        </p>
      </header>

      <Card className='border-border/60 bg-card/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Batch overview</CardTitle>
          <CardDescription>
            Verifiable identifiers for disclosure and audit requests.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              IP Asset
            </p>
            <p className='text-sm font-medium'>{record.ipTitle}</p>
            <Link
              href={ipAssetExplorerUrl(record.ipId, storyNetwork)}
              target='_blank'
              rel='noreferrer'
              className='text-xs text-primary underline-offset-4 hover:underline'
            >
              View on Story explorer
            </Link>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Units processed
            </p>
            <p className='text-sm font-semibold'>
              {record.units.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Evidence hash
            </p>
            <p className='font-mono text-xs break-all'>{record.evidenceHash}</p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Timestamp
            </p>
            <p className='text-sm text-foreground'>
              {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Constellation transaction
            </p>
            {constellationLink ? (
              <Link
                href={constellationLink}
                target='_blank'
                rel='noreferrer'
                className='font-mono text-xs text-primary underline-offset-4 hover:underline'
              >
                {record.constellationTx}
              </Link>
            ) : (
              <p className='font-mono text-xs'>Pending</p>
            )}
          </div>
        </CardContent>
      </Card>

      {payloadJson && (
        <Card className='border-border/60 bg-card/60 shadow-sm'>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
            <CardDescription>
              Canonical JSON sealed into the Constellation transaction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className='max-h-[320px] overflow-auto rounded-md bg-muted/60 p-4 text-xs'>
              {payloadJson}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
