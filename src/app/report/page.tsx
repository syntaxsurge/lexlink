import Link from 'next/link'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { DisputeForm } from '@/components/app/dispute-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getConvexClient } from '@/lib/convex'

type ReportPageProps = {
  searchParams?: Promise<{
    ipId?: string
  }>
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const convex = getConvexClient()
  const ips = (await convex.query('ipAssets:list' as any, {})) as Array<{
    ipId: string
    title: string
  }>

  const params = searchParams ? await searchParams : undefined
  const defaultIpId = typeof params?.ipId === 'string' ? params.ipId : undefined

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 py-10'>
      <Card className='border-border/60 bg-card/70 shadow-lg'>
        <CardHeader>
          <CardTitle>Report an IP asset</CardTitle>
          <CardDescription>
            Upload screenshots, audio, video, or documents—or supply a source
            URL—and we’ll pin everything to IPFS before triggering Story’s
            UMA-backed dispute process. Reports require Internet Identity
            sign-in so we can anchor the reporter principal.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <DisputeForm ips={ips} defaultIpId={defaultIpId} />
          <div className='rounded-lg border border-dashed border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground'>
            Disputes are relayed through the Dispute Module and UMA arbitration
            policy. Once a tag such as{' '}
            <span className='font-mono text-foreground'>
              {DisputeTargetTag.IMPROPER_USAGE}
            </span>{' '}
            is upheld, downstream modules block new licensing, royalty claims,
            and derivative registrations until a resolution clears the tag.
            Evidence uploads are limited to 5&nbsp;MB each; larger assets should
            be summarised via compressed archives or hosted URLs.
          </div>
        </CardContent>
      </Card>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Reference material</CardTitle>
          <CardDescription>
            These links cover the arbitration surface LexLink integrates with.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 text-sm'>
          <Link
            href='https://docs.story.foundation/concepts/dispute-module/overview'
            className='text-primary underline-offset-4 hover:underline'
            target='_blank'
            rel='noreferrer'
          >
            Story Protocol · Dispute Module overview
          </Link>
          <Link
            href='https://docs.story.foundation/concepts/dispute-module/uma-arbitration-policy'
            className='text-primary underline-offset-4 hover:underline'
            target='_blank'
            rel='noreferrer'
          >
            UMA Arbitration Policy for Story disputes
          </Link>
          <Link
            href='https://docs.story.foundation/concepts/story-attestation-service'
            className='text-primary underline-offset-4 hover:underline'
            target='_blank'
            rel='noreferrer'
          >
            Story Attestation Service · evidence ingestion
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
