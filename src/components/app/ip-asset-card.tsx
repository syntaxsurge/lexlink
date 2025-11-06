'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ipfsGatewayUrl } from '@/lib/ipfs'
import {
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'
import type {
  AiMetadataRecord,
  CreatorShare,
  IpRecord
} from '@/app/dashboard/actions'

const FALLBACK_IMAGE =
  'https://images.lexlink.dev/fallback-ip-asset.png'

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
  const mediaUrl = resolveAssetUrl(asset.mediaUrl)
  const imageUrl = resolveAssetUrl(asset.imageUrl)
  const royaltyPercent = (asset.royaltyBps / 100).toFixed(2)
  const creators = asset.creators ?? []

  return (
    <Card className={cn('flex h-full flex-col border-border/70 bg-card/70 shadow-sm backdrop-blur', className)}>
      <CardHeader className='space-y-3'>
        <div className='relative overflow-hidden rounded-lg border border-border/60 bg-muted/30'>
          {renderMediaPreview(asset.mediaType, mediaUrl, imageUrl)}
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
        <CardTitle className='text-xl font-semibold text-foreground'>
          {asset.title}
        </CardTitle>
        <p className='line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
          {asset.description}
        </p>
        <div className='flex flex-wrap gap-2'>
          <Badge variant='outline' className='border-primary/40 text-primary'>
            {asset.commercialUse ? 'Commercial' : 'Personal'} use
          </Badge>
          <Badge variant='outline' className='border-border/60'>
            {royaltyPercent}% royalties
          </Badge>
          {asset.tags?.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant='outline'
              className='border-border/40 bg-background/70 text-muted-foreground'
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 rounded-lg border border-border/60 bg-background/70 p-3 text-xs'>
          <InfoRow label='Story IP'>
            <Link
              href={ipAssetExplorerUrl(asset.ipId, network)}
              target='_blank'
              rel='noreferrer'
              className='break-all font-mono text-[11px] text-primary underline-offset-4 hover:underline'
            >
              {asset.ipId}
            </Link>
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
                <CreatorChip key={`${creator.address}-${creator.name}`} creator={creator} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className='mt-auto flex flex-col gap-3 pt-0'>
        <div className='flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm'>
          <span className='text-muted-foreground'>Commercial terms</span>
          <span className='font-semibold text-foreground'>
            {asset.commercialUse ? 'Commercial licensing enabled' : 'Non-commercial license'}
          </span>
        </div>
        {actionSlot ? (
          <div
            className={cn(
              'flex w-full flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/10 p-3',
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

function renderMediaPreview(mediaType: string, mediaUrl: string, imageUrl: string) {
  if (mediaType.startsWith('video/')) {
    return (
      <video
        src={mediaUrl}
        poster={imageUrl}
        controls
        className='h-56 w-full rounded-lg object-cover'
        preload='metadata'
      />
    )
  }

  if (mediaType.startsWith('audio/')) {
    return (
      <div className='flex h-56 flex-col items-center justify-center gap-4 bg-background/80 p-6'>
        <Image
          src={imageUrl}
          alt='Audio cover'
          width={160}
          height={160}
          className='h-36 w-36 rounded-lg object-cover shadow-lg'
        />
        <audio src={mediaUrl} controls className='w-full'>
          Your browser does not support the audio element.
        </audio>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={mediaType}
      width={800}
      height={600}
      className='h-56 w-full rounded-lg object-cover'
      unoptimized={imageUrl.startsWith('https://ipfs')}
      onError={event => {
        const target = event.currentTarget as HTMLImageElement
        if (target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE
        }
      }}
    />
  )
}

function resolveAssetUrl(uri: string) {
  if (!uri) {
    return FALLBACK_IMAGE
  }
  if (uri.startsWith('ipfs://')) {
    return ipfsGatewayUrl(uri)
  }
  try {
    const parsed = new URL(uri)
    return parsed.toString()
  } catch {
    return uri
  }
}

function CreatorChip({ creator }: { creator: CreatorShare }) {
  return (
    <div className='flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs'>
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
      <div className='mt-1 text-xs text-foreground'>
        {ai.model} {ai.provider ? `· ${ai.provider}` : null}
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
