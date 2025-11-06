import { loadPublicCatalog } from '@/app/dashboard/actions'
import { GalleryExplorer } from '@/components/app/gallery-explorer'
import { env } from '@/lib/env'

const network =
  (env.NEXT_PUBLIC_STORY_NETWORK as 'aeneid' | 'mainnet') ?? 'aeneid'

export default async function GalleryPage() {
  const assets = await loadPublicCatalog()

  return (
    <div className='container-edge py-16'>
      <div className='mx-auto max-w-5xl space-y-10'>
        <header className='space-y-4 text-center'>
          <p className='inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary'>
            LexLink IP Gallery
          </p>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
            Explore Story Protocol IP ready for licensing
          </h1>
          <p className='text-base text-muted-foreground md:text-lg'>
            Browse audio, video, and visual assets registered through LexLink. Every card includes creator attribution, royalty splits, and direct Story identifiers.
          </p>
        </header>
        <GalleryExplorer assets={assets} network={network} />
      </div>
    </div>
  )
}
