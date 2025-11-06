'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { useSession } from 'next-auth/react'

import { type IpRecord } from '@/app/dashboard/actions'
import { IpAssetCard } from '@/components/app/ip-asset-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { type StoryNetwork } from '@/lib/story-links'
import { cn } from '@/lib/utils'

type FilterKey = 'all' | 'image' | 'audio' | 'video' | 'ai'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All media' },
  { key: 'image', label: 'Images' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'ai', label: 'AI generated' }
]

type GalleryExplorerProps = {
  assets: IpRecord[]
  network: StoryNetwork
}

export function GalleryExplorer({ assets, network }: GalleryExplorerProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return assets.filter(asset => {
      if (filter === 'image' && !asset.mediaType.startsWith('image/')) {
        return false
      }
      if (filter === 'audio' && !asset.mediaType.startsWith('audio/')) {
        return false
      }
      if (filter === 'video' && !asset.mediaType.startsWith('video/')) {
        return false
      }
      if (filter === 'ai' && !asset.aiMetadata) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      const haystack = [
        asset.title,
        asset.description,
        ...(asset.tags ?? []),
        ...(asset.creators ?? []).map(creator => creator.name)
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [assets, filter, query])

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          {FILTERS.map(item => (
            <Button
              key={item.key}
              type='button'
              variant={filter === item.key ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter(item.key)}
              className={cn(
                'border-border/60',
                filter === item.key && 'border-primary/60 shadow-sm'
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className='relative w-full md:w-72'>
          <Input
            type='search'
            placeholder='Search by title, tag, or creator…'
            value={query}
            onChange={event => setQuery(event.target.value)}
            className='h-10'
          />
        </div>
      </div>

      {filteredAssets.length > 0 ? (
        <div className='grid gap-6 lg:grid-cols-2 2xl:grid-cols-3'>
          {filteredAssets.map(asset => (
            <IpAssetCard
              key={asset.ipId}
              asset={asset}
              network={network}
              highlightActions
              actionSlot={
                <div className='space-y-3 text-xs text-muted-foreground'>
                  <p className='font-semibold text-foreground'>
                    {isAuthenticated ? 'License this asset' : 'Sign in to license'}
                  </p>
                  <p>
                    {isAuthenticated
                      ? 'Generate a ckBTC or BTC invoice from the dashboard to monetize this registration instantly.'
                      : 'Sign in with Internet Identity to allocate ckBTC or BTC invoices and manage settlement.'}
                  </p>
                  <div className='flex flex-wrap items-center gap-2'>
                    {isAuthenticated ? (
                      <>
                        <Button asChild size='sm' variant='default'>
                          <Link href={`/dashboard/licenses?ip=${asset.ipId}`}>
                            Create license order
                          </Link>
                        </Button>
                        <Button asChild size='sm' variant='outline'>
                          <Link href={`/dashboard/ip?focus=${asset.ipId}`}>
                            View in dashboard
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild size='sm' variant='outline'>
                        <Link href='/signin'>Sign in to license</Link>
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <Card className='border-dashed border-border/60 bg-muted/20 py-16 text-center'>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              No assets match your filters. Reset the filters or refine your search terms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
