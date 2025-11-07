import Link from 'next/link'

import { DisputeTargetTag } from '@story-protocol/core-sdk'
import { AlertTriangle, BookOpen, ExternalLink, Shield } from 'lucide-react'

import { DisputeForm } from '@/components/app/dispute-form'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
    <div className='container-edge space-y-12 py-12'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-rose-500/10 via-card to-background p-12 text-center shadow-2xl'>
        <div className='absolute left-0 top-0 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl' />
        <div className='relative z-10 space-y-6'>
          <Badge
            variant='outline'
            className='mx-auto w-fit border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-rose-700 dark:text-rose-400'
          >
            <AlertTriangle className='mr-2 h-3 w-3' />
            IP Dispute Portal
          </Badge>
          <div className='space-y-3'>
            <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
              Report an IP Asset
            </h1>
            <p className='mx-auto max-w-2xl text-base text-muted-foreground md:text-lg'>
              Upload screenshots, audio, video, or documents—or supply a source
              URL—and we'll pin everything to IPFS before triggering Story's
              UMA-backed dispute process.
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <div className='flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-5 py-2.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm'>
              <Shield className='h-3.5 w-3.5 text-primary' />
              <span>Protected by UMA Arbitration</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr,400px]'>
        {/* Report Form */}
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-2xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start gap-4'>
              <div className='rounded-2xl border-2 border-border/60 bg-gradient-to-br from-rose-500/10 to-background p-3 shadow-lg'>
                <AlertTriangle className='h-6 w-6 text-rose-600 dark:text-rose-400' />
              </div>
              <div className='flex-1'>
                <CardTitle className='text-2xl font-bold'>
                  File a Dispute Report
                </CardTitle>
                <CardDescription className='mt-2 text-sm leading-relaxed'>
                  Reports require Internet Identity sign-in so we can anchor the
                  reporter principal. All evidence is cryptographically verified
                  and stored on IPFS.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border to-transparent' />
          <CardContent className='space-y-6 pt-6'>
            <DisputeForm ips={ips} defaultIpId={defaultIpId} />

            {/* Info Box */}
            <div className='space-y-3 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background/80 to-background p-5 shadow-lg'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                <p className='text-sm font-semibold text-foreground'>
                  Important Information
                </p>
              </div>
              <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
              <div className='space-y-2 text-xs text-muted-foreground'>
                <p>
                  Disputes are relayed through the Dispute Module and UMA
                  arbitration policy. Once a tag such as{' '}
                  <span className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground'>
                    {DisputeTargetTag.IMPROPER_USAGE}
                  </span>{' '}
                  is upheld, downstream modules block new licensing, royalty
                  claims, and derivative registrations until a resolution clears
                  the tag.
                </p>
                <p>
                  Evidence uploads are limited to{' '}
                  <span className='font-semibold text-foreground'>
                    5 MB each
                  </span>
                  . Larger assets should be summarised via compressed archives
                  or hosted URLs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* How It Works */}
          <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-b from-card to-background shadow-lg'>
            <CardHeader className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='rounded-lg bg-primary/10 p-2'>
                  <Shield className='h-5 w-5 text-primary' />
                </div>
                <CardTitle className='text-xl font-semibold'>
                  How It Works
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex gap-3'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    1
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm font-medium text-foreground'>
                      Submit Evidence
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Upload proof of IP misuse with supporting documentation
                    </p>
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    2
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm font-medium text-foreground'>
                      IPFS Anchoring
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Evidence is pinned to IPFS for permanent, verifiable
                      storage
                    </p>
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    3
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm font-medium text-foreground'>
                      UMA Arbitration
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Dispute is reviewed by UMA's optimistic oracle system
                    </p>
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    4
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm font-medium text-foreground'>
                      Resolution
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      IP is tagged and enforcement actions are applied
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference Material */}
          <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-b from-card to-background shadow-lg'>
            <CardHeader className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='rounded-lg bg-primary/10 p-2'>
                  <BookOpen className='h-5 w-5 text-primary' />
                </div>
                <CardTitle className='text-xl font-semibold'>
                  Reference Material
                </CardTitle>
              </div>
              <CardDescription>
                Learn more about the arbitration process
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Link
                href='https://docs.story.foundation/concepts/dispute-module/overview'
                className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5'
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLink className='h-4 w-4 text-primary' />
                <span>Dispute Module Overview</span>
              </Link>
              <Link
                href='https://docs.story.foundation/concepts/dispute-module/uma-arbitration-policy'
                className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5'
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLink className='h-4 w-4 text-primary' />
                <span>UMA Arbitration Policy</span>
              </Link>
              <Link
                href='https://docs.story.foundation/concepts/story-attestation-service'
                className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5'
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLink className='h-4 w-4 text-primary' />
                <span>Story Attestation Service</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
