import { Wand2 } from 'lucide-react'

import { loadDashboardData, type IpRecord } from '@/app/dashboard/actions'
import { AiStudio } from '@/components/app/ai-studio'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export default async function AiGenerationPage() {
  const { ips } = await loadDashboardData()
  const aiAssets = ips
    .filter((ip: IpRecord) => Boolean(ip.aiMetadata))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 6)
  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-purple-500/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-purple-700 dark:text-purple-400'
          >
            <Wand2 className='mr-2 h-3 w-3' />
            AI Studio
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              AI Asset Generation
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              Use LexLink's Provenance AI pipeline to mint Story Protocol
              assets, capture royalty splits, and sync them directly with the
              marketplace.
            </p>
          </div>
        </div>
      </section>

      <AiStudio recentAssets={aiAssets} network={network} />
    </div>
  )
}
