import Link from 'next/link'

import { loadPublicCatalog } from '@/app/dashboard/actions'
import { GalleryExplorer } from '@/components/app/gallery-explorer'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const assets = await loadPublicCatalog()

  return (
    <div className='container-edge space-y-12 py-16'>
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-background via-card to-background p-12 text-center shadow-2xl'>
        <div className='absolute -left-10 top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <div className='mx-auto w-fit rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary'>
            LexLink gallery
          </div>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
            Visual IP ready for Story licensing
          </h1>
          <p className='mx-auto max-w-3xl text-base text-muted-foreground md:text-lg'>
            Browse assets minted through LexLink. Each card exposes Story
            identifiers, royalty splits, and derivative permissions so you can
            audit a listing at a glance.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3 text-sm'>
            <p className='text-muted-foreground'>
              Need ckBTC settlement? Jump into the marketplace view.
            </p>
            <Link
              href='/marketplace'
              className='inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-medium text-primary transition hover:bg-primary/20'
            >
              Visit marketplace
            </Link>
          </div>
        </div>
      </section>
      <div className='mx-auto max-w-6xl'>
        <GalleryExplorer assets={assets} network={network} />
      </div>
    </div>
  )
}
