'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { ArrowUpRight } from 'lucide-react'

import type {
  AiMetadataRecord,
  CreatorShare,
  IpRecord
} from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { IPFS_GATEWAYS } from '@/lib/ipfs-gateways'
import { ipAssetExplorerUrl, type StoryNetwork } from '@/lib/story-links'
import { cn } from '@/lib/utils'

type IpAssetCardProps = {
  asset: IpRecord
  network?: StoryNetwork
  className?: string
  actionSlot?: React.ReactNode
  highlightActions?: boolean
}

export function IpAssetCard({
  asset,
  network = process.env.NEXT_PUBLIC_STORY_NETWORK === 'mainnet'
    ? 'mainnet'
    : 'aeneid',
  className,
  actionSlot,
  highlightActions = false
}: IpAssetCardProps) {
  const imageSources = useMemo(
    () => buildIpfsSources(asset.imageUrl),
    [asset.imageUrl]
  )
  const mediaSources = useMemo(
    () => buildIpfsSources(asset.mediaUrl),
    [asset.mediaUrl]
  )
  const [imageSourceIndex, setImageSourceIndex] = useState(0)

  useEffect(() => {
    setImageSourceIndex(0)
  }, [asset.imageUrl])

  const activeImageUrl =
    imageSourceIndex >= 0
      ? (imageSources[imageSourceIndex] ?? asset.imageUrl ?? '')
      : ''

  const handleImageError = () => {
    if (imageSourceIndex < imageSources.length - 1) {
      setImageSourceIndex(prev => prev + 1)
    } else {
      setImageSourceIndex(-1)
    }
  }

  const royaltyPercent = (asset.royaltyBps / 100).toFixed(2)
  const creators = asset.creators ?? []

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden border-border/70 bg-card/80 shadow-lg shadow-black/5 backdrop-blur',
        className
      )}
    >
      <CardHeader className='space-y-3'>
        <div className='relative overflow-hidden rounded-xl border border-border/60 bg-muted/30'>
          {renderMediaPreview({
            mediaType: asset.mediaType,
            mediaSources,
            imageSrc: activeImageUrl,
            onImageError: handleImageError
          })}
          {asset.aiMetadata ? (
            <Badge className='absolute left-3 top-3 border border-primary/40 bg-primary/20 text-primary-foreground backdrop-blur'>
              AI Generated
            </Badge>
          ) : null}
          {asset.derivativesAllowed ? (
            <Badge className='absolute right-3 top-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 backdrop-blur'>
              Derivatives OK
            </Badge>
          ) : (
            <Badge className='absolute right-3 top-3 border border-amber-500/40 bg-amber-500/10 text-amber-500 backdrop-blur'>
              Derivatives Locked
            </Badge>
          )}
        </div>
        <CardTitle className='line-clamp-2 text-xl font-semibold text-foreground'>
          {asset.title}
        </CardTitle>
        <p className='line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
          {asset.description}
        </p>
        <div className='flex flex-wrap gap-2'>
          <Badge
            variant='outline'
            className='border-primary/40 bg-primary/5 text-primary'
          >
            {asset.commercialUse ? 'Commercial' : 'Personal'} use
          </Badge>
          <Badge variant='outline' className='border-border/60'>
            {royaltyPercent}% royalties
          </Badge>
          {asset.tags?.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant='outline'
              className='border-border/60 bg-background/80 text-muted-foreground'
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 rounded-lg border border-border/60 bg-background/70 p-3 text-xs'>
          <InfoRow label='Story IP'>
            <div className='flex flex-col gap-2'>
              <span className='break-words font-mono text-[11px] text-muted-foreground'>
                {asset.ipId}
              </span>
              <Button
                size='sm'
                variant='outline'
                className='w-fit gap-1 rounded-full px-3 py-1 text-xs'
                asChild
              >
                <Link
                  href={ipAssetExplorerUrl(asset.ipId, network)}
                  target='_blank'
                  rel='noreferrer'
                >
                  View on Story Explorer
                  <ArrowUpRight className='h-3 w-3' />
                </Link>
              </Button>
            </div>
          </InfoRow>
          <InfoRow label='Media type'>
            <span className='font-medium text-foreground'>
              {asset.mediaType || 'Unknown'}
            </span>
          </InfoRow>
          <InfoRow label='Price'>
            <span className='font-medium text-foreground'>
              {(asset.priceSats / 100_000_000).toFixed(6)} BTC
            </span>
          </InfoRow>
          {asset.aiMetadata ? (
            <AiMetadataDetails ai={asset.aiMetadata} />
          ) : null}
        </div>

        {creators.length > 0 ? (
          <div className='space-y-2'>
            <h3 className='text-sm font-semibold text-foreground'>Creators</h3>
            <div className='space-y-2'>
              {creators.map(creator => (
                <CreatorChip
                  key={`${creator.address}-${creator.name}`}
                  creator={creator}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className='mt-auto flex flex-col gap-3 pt-0'>
        <div className='flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-3 text-sm'>
          <span className='text-muted-foreground'>Commercial terms</span>
          <span className='font-semibold text-foreground'>
            {asset.commercialUse
              ? 'Commercial licensing enabled'
              : 'Non-commercial license'}
          </span>
        </div>
        {actionSlot ? (
          <div
            className={cn(
              'flex w-full flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/10 p-3',
              highlightActions && 'border-solid bg-primary/15 shadow-sm'
            )}
          >
            {actionSlot}
          </div>
        ) : (
          <Button asChild variant='outline' className='w-full'>
            <Link
              href='/signin'
              className='flex w-full items-center justify-center gap-2 text-sm'
            >
              Sign in to request licensing
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function renderMediaPreview({
  mediaType,
  mediaSources,
  imageSrc,
  onImageError
}: {
  mediaType?: string
  mediaSources: string[]
  imageSrc: string
  onImageError: () => void
}) {
  const type = (mediaType ?? '').toLowerCase()

  if (type.startsWith('video/')) {
    const [primary, ...fallbacks] = mediaSources
    if (!primary && !imageSrc) {
      return (
        <div className='flex h-56 items-center justify-center bg-muted/40 text-xs text-muted-foreground'>
          Video preview unavailable
        </div>
      )
    }
    const sources = [primary, ...fallbacks, imageSrc].filter(
      Boolean
    ) as string[]
    return (
      <video
        key={sources[0]}
        poster={imageSrc || undefined}
        controls
        preload='metadata'
        className='h-56 w-full object-cover'
      >
        {sources.map(source => (
          <source key={source} src={source} />
        ))}
        Your browser does not support the video element.
      </video>
    )
  }

  if (type.startsWith('audio/')) {
    const audioSources =
      mediaSources.length > 0 ? mediaSources : imageSrc ? [imageSrc] : []
    return (
      <div className='flex h-56 flex-col items-center justify-center gap-4 bg-background/85 p-6'>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt='Audio cover'
            width={160}
            height={160}
            className='h-36 w-36 rounded-lg object-cover shadow-lg'
            unoptimized={isIpfsUri(imageSrc)}
            onError={onImageError}
          />
        ) : (
          <div className='flex h-36 w-36 items-center justify-center rounded-lg bg-muted/40 text-xs text-muted-foreground'>
            Cover unavailable
          </div>
        )}
        {audioSources.length > 0 ? (
          <audio
            controls
            preload='none'
            controlsList='play nodownload'
            className='w-full rounded-md bg-background/80'
          >
            {audioSources.map(source => (
              <source key={source} src={source} />
            ))}
            Your browser does not support the audio element.
          </audio>
        ) : (
          <div className='text-xs text-muted-foreground'>
            Audio preview unavailable
          </div>
        )}
      </div>
    )
  }

  if (!imageSrc) {
    return (
      <div className='flex h-56 items-center justify-center bg-muted/40 text-xs text-muted-foreground'>
        Artwork unavailable
      </div>
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={mediaType ?? 'Asset preview'}
      width={800}
      height={600}
      className='h-56 w-full object-cover'
      unoptimized={isIpfsUri(imageSrc)}
      onError={onImageError}
    />
  )
}

function buildIpfsSources(uri?: string) {
  if (!uri) {
    return []
  }
  const sources = new Set<string>()
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '').replace(/^\/+/, '')
    IPFS_GATEWAYS.forEach(gateway => sources.add(`${gateway}${cid}`))
  } else if (uri.includes('/ipfs/')) {
    const cidPath = uri.substring(uri.indexOf('/ipfs/') + '/ipfs/'.length)
    IPFS_GATEWAYS.forEach(gateway => sources.add(`${gateway}${cidPath}`))
  }
  sources.add(uri)
  return Array.from(sources)
}

function isIpfsUri(uri?: string) {
  if (!uri) return false
  return uri.startsWith('ipfs://') || uri.includes('/ipfs/')
}

function CreatorChip({ creator }: { creator: CreatorShare }) {
  return (
    <div className='flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='font-medium text-foreground'>{creator.name}</span>
        <span className='font-mono text-[11px] text-muted-foreground'>
          {creator.contributionPercent}% split
        </span>
      </div>
      <div className='break-all font-mono text-[10px] text-muted-foreground'>
        {creator.address}
      </div>
      {creator.role && (
        <span className='text-[10px] uppercase tracking-wide text-muted-foreground'>
          {creator.role}
        </span>
      )}
      {creator.description && (
        <p className='text-[11px] leading-relaxed text-muted-foreground'>
          {creator.description}
        </p>
      )}
      {creator.socialMedia && creator.socialMedia.length > 0 && (
        <div className='flex flex-wrap gap-2 pt-1'>
          {creator.socialMedia.map(link => (
            <Badge
              key={link.url}
              variant='outline'
              className='border-border/40 text-foreground'
            >
              <a
                href={link.url}
                target='_blank'
                rel='noreferrer'
                className='underline-offset-4 hover:underline'
              >
                {link.platform}
              </a>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function AiMetadataDetails({ ai }: { ai: AiMetadataRecord }) {
  return (
    <div className='rounded-md border border-border/60 bg-background/70 p-3'>
      <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
        AI provenance
      </p>
      <div className='mt-1 flex items-center gap-2 text-xs text-foreground'>
        {ai.model}
        {ai.provider ? (
          <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground'>
            {ai.provider}
          </span>
        ) : null}
      </div>
      <p className='mt-2 text-[11px] leading-relaxed text-muted-foreground'>
        {ai.enhancedPrompt ?? ai.prompt}
      </p>
      {ai.enhancedPrompt && (
        <p className='mt-1 text-[11px] text-muted-foreground'>
          Original prompt:{' '}
          <span className='font-medium text-foreground'>{ai.prompt}</span>
        </p>
      )}
      {ai.contentHash && (
        <p className='mt-1 break-all font-mono text-[10px] text-muted-foreground'>
          hash: {ai.contentHash}
        </p>
      )}
    </div>
  )
}

function InfoRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-[10px] uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}
