import Link from 'next/link'

import { Layers, Sparkles, BookOpen, ExternalLink } from 'lucide-react'

import { loadDashboardData } from '@/app/dashboard/actions'
import { RegisterIpForm } from '@/components/app/register-ip-form'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function IpRegistryPage() {
  const { ips } = await loadDashboardData()

  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary'
          >
            <Layers className='mr-2 h-3 w-3' />
            IP Registry
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              Intellectual Property Assets
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              Register Story Protocol IP assets, attach programmable licenses,
              and manage your portfolio with automated provenance tracking.
            </p>
          </div>
        </div>
      </section>

      <div className='grid gap-8 xl:grid-cols-[1.3fr_1fr]'>
        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start gap-3'>
              <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
                <Sparkles className='h-6 w-6 text-primary' />
              </div>
              <div className='space-y-1'>
                <CardTitle className='text-2xl font-bold'>
                  Register Story IP Asset
                </CardTitle>
                <CardDescription className='text-sm'>
                  Mint an SPG NFT, attach programmable PIL terms, and mirror the
                  asset into Convex with creator splits, royalties, and AI
                  provenance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='pt-6'>
            <RegisterIpForm />
          </CardContent>
        </Card>

        <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-b from-card to-background shadow-xl'>
          <CardHeader className='space-y-4 pb-6'>
            <div className='flex items-start gap-3'>
              <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-background p-3 shadow-lg'>
                <BookOpen className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
              </div>
              <div className='space-y-1'>
                <CardTitle className='text-xl font-bold'>
                  Catalogue Snapshot
                </CardTitle>
                <CardDescription className='text-sm'>
                  Updated whenever a registration completes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
          <CardContent className='space-y-6 pt-6'>
            <MetricCard
              label='Total registered assets'
              value={ips.length.toString()}
              helper='Story Protocol IPAs mirrored locally'
            />
            <div className='space-y-3 text-sm text-muted-foreground'>
              <p>
                Each IP includes creator credits, royalty splits, and metadata
                bundles ready for marketplaces and compliance workflows.
              </p>
              <p>
                Every registration also forwards the asset to LexLink&apos;s
                public gallery so prospective buyers can preview media before
                requesting an invoice.
              </p>
            </div>
            <Link
              href='https://docs.story.foundation/concepts/spg/overview'
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-sm font-medium transition-all hover:border-primary/40 hover:bg-primary/5'
            >
              <ExternalLink className='h-4 w-4' />
              Story Protocol SPG Documentation
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className='rounded-3xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground'>
        Registered assets live exclusively in the gallery, keeping the registry
        focused on submissions and catalogue health.
      </Card>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  helper: string
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-background p-6 shadow-lg'>
      <p className='text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground'>
        {label}
      </p>
      <p className='mt-3 text-4xl font-bold text-foreground'>{value}</p>
      <p className='mt-2 text-xs text-muted-foreground'>{helper}</p>
    </div>
  )
}
