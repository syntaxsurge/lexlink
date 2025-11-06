import Link from 'next/link'

import { loadPublicCatalog } from '@/app/dashboard/actions'
import { GalleryExplorer } from '@/components/app/gallery-explorer'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export default async function GalleryPage() {
  const assets = await loadPublicCatalog()

  return (
    <div className='container-edge space-y-12 py-16'>
      <header className='mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-background via-card to-background p-10 text-center shadow-lg'>
        <div className='inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary'>
          LexLink IP Gallery
        </div>
        <h1 className='mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
          Explore Story Protocol IP ready for licensing
        </h1>
        <p className='mt-3 text-base text-muted-foreground md:text-lg'>
          Browse audio, video, and visual assets registered through LexLink. Every card includes creator attribution, royalty splits, and direct Story identifiers.
        </p>
        <div className='mt-6 flex flex-wrap items-center justify-center gap-3 text-sm'>
          <p className='text-muted-foreground'>
            Want to settle a license? Switch to the marketplace to view ckBTC-ready listings.
          </p>
          <Link
            href='/marketplace'
            className='inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-medium text-primary transition hover:bg-primary/20'
          >
            Visit marketplace
          </Link>
        </div>
      </header>
      <div className='mx-auto max-w-6xl'>
        <GalleryExplorer assets={assets} network={network} />
      </div>
    </div>
  )
}
