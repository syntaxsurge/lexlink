import Link from 'next/link'

import { loadPublicCatalog } from '@/app/dashboard/actions'
import { MarketplaceBoard } from '@/components/app/marketplace-board'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export default async function MarketplacePage() {
  const assets = await loadPublicCatalog()

  return (
    <div className='container-edge space-y-12 py-16'>
      <header className='mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-card via-background to-card p-10 text-center shadow-lg'>
        <div className='inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary'>
          LexLink Marketplace
        </div>
        <h1 className='mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
          License Story Protocol IP with Bitcoin or ckBTC
        </h1>
        <p className='mt-3 text-base text-muted-foreground md:text-lg'>
          Every listing is minted on Story Protocol, includes creator royalties,
          and settles automatically once ckBTC or BTC lands in escrow.
        </p>
        <div className='mt-6 flex flex-wrap items-center justify-center gap-3 text-sm'>
          <p className='text-muted-foreground'>
            Exploring assets instead? Head back to the gallery for full
            previews.
          </p>
          <Link
            href='/gallery'
            className='inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 font-medium text-foreground transition hover:border-primary/40 hover:text-primary'
          >
            View gallery
          </Link>
        </div>
      </header>
      <div className='mx-auto max-w-6xl'>
        <MarketplaceBoard assets={assets} network={network} />
      </div>
    </div>
  )
}
