import Link from 'next/link'

import { loadPublicCatalog } from '@/app/dashboard/actions'
import { MarketplaceBoard } from '@/components/app/marketplace-board'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const assets = await loadPublicCatalog()

  return (
    <div className='container-edge space-y-12 py-16'>
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-card via-background to-card p-12 text-center shadow-2xl'>
        <div className='absolute left-0 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <div className='mx-auto w-fit rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary'>
            LexLink marketplace
          </div>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
            License Story IP with ckBTC
          </h1>
          <p className='mx-auto max-w-3xl text-base text-muted-foreground md:text-lg'>
            Listings reflect live pricing, derivative permissions, and royalty
            splits. Generate invoices or share ckBTC payment links with buyers
            in a single flow.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3 text-sm'>
            <p className='text-muted-foreground'>
              Want deeper previews? Visit the gallery.
            </p>
            <Link
              href='/gallery'
              className='inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 font-medium text-foreground transition hover:border-primary/40 hover:text-primary'
            >
              View gallery
            </Link>
          </div>
        </div>
      </section>
      <div className='mx-auto max-w-6xl'>
        <MarketplaceBoard assets={assets} network={network} />
      </div>
    </div>
  )
}
