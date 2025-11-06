import { loadDashboardData, type IpRecord } from '@/app/dashboard/actions'
import { AiStudio } from '@/components/app/ai-studio'
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
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold text-foreground'>
          AI Asset Generation
        </h1>
        <p className='text-sm text-muted-foreground'>
          Use LexLink’s Provenance AI pipeline to mint Story Protocol assets,
          capture royalty splits, and sync them directly with the marketplace.
        </p>
      </div>
      <AiStudio recentAssets={aiAssets} network={network} />
    </div>
  )
}
