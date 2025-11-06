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

type SortKey = 'latest' | 'price-asc' | 'price-desc' | 'royalty'

type MarketplaceBoardProps = {
  assets: IpRecord[]
  network: StoryNetwork
}

export function MarketplaceBoard({ assets, network }: MarketplaceBoardProps) {
  const [sort, setSort] = useState<SortKey>('latest')
  const [query, setQuery] = useState('')
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'

  const sortedAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return [...assets]
      .filter(asset => {
        if (!normalizedQuery) {
          return true
        }
        const haystack = [
          asset.title,
          asset.description,
          ...(asset.tags ?? [])
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return (a.priceSats ?? 0) - (b.priceSats ?? 0)
          case 'price-desc':
            return (b.priceSats ?? 0) - (a.priceSats ?? 0)
          case 'royalty':
            return (b.royaltyBps ?? 0) - (a.royaltyBps ?? 0)
          case 'latest':
          default:
            return (b.createdAt ?? 0) - (a.createdAt ?? 0)
        }
      })
  }, [assets, sort, query])

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex gap-2'>
          <SortButton
            active={sort === 'latest'}
            onClick={() => setSort('latest')}
          >
            Latest
          </SortButton>
          <SortButton
            active={sort === 'price-asc'}
            onClick={() => setSort('price-asc')}
          >
            Price ↑
          </SortButton>
          <SortButton
            active={sort === 'price-desc'}
            onClick={() => setSort('price-desc')}
          >
            Price ↓
          </SortButton>
          <SortButton
            active={sort === 'royalty'}
            onClick={() => setSort('royalty')}
          >
            Highest royalties
          </SortButton>
        </div>
        <Input
          type='search'
          placeholder='Search by title or tag…'
          value={query}
          onChange={event => setQuery(event.target.value)}
          className='h-10 md:w-72'
        />
      </div>

      {sortedAssets.length > 0 ? (
        <div className='grid gap-6 lg:grid-cols-2 2xl:grid-cols-3'>
          {sortedAssets.map(asset => (
            <IpAssetCard
              key={asset.ipId}
              asset={asset}
              network={network}
              highlightActions
              actionSlot={
                <div className='space-y-3 text-xs text-muted-foreground'>
                  <p className='font-semibold text-foreground'>
                    {isAuthenticated ? 'Launch a licensing workflow' : 'Sign in to license'}
                  </p>
                  <p>
                    {isAuthenticated
                      ? 'Generate a ckBTC invoice or share a Story checkout link with your buyer in a few clicks.'
                      : 'Authenticate to create ckBTC or BTC invoices and manage settlement history.'}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {isAuthenticated ? (
                      <>
                        <Button asChild size='sm' variant='default'>
                          <Link href={`/dashboard/licenses?ip=${asset.ipId}`}>
                            Create ckBTC invoice
                          </Link>
                        </Button>
                        <Button asChild size='sm' variant='outline'>
                          <Link href={`/dashboard/purchases`}>
                            Review buyer receipts
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild size='sm' variant='default'>
                        <Link href='/signin'>Sign in</Link>
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
              No marketplace listings match your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SortButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type='button'
      size='sm'
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className='border-border/60'
    >
      {children}
    </Button>
  )
}
