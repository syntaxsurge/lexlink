'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Wand2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { generateAiIpAsset, type IpRecord } from '@/app/dashboard/actions'
import { IpAssetCard } from '@/components/app/ip-asset-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ipAssetExplorerUrl, type StoryNetwork } from '@/lib/story-links'

const formSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, 'Describe the IP you want generated (at least 20 characters)'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z
    .string()
    .trim()
    .min(40, 'Explain the asset in at least 40 characters'),
  tags: z.string().optional(),
  priceBtc: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.00000001, 'Price must be at least 0.00000001 BTC'),
  royaltyPercent: z
    .number({ invalid_type_error: 'Set a royalty percentage' })
    .min(0, 'Royalties cannot be negative')
    .max(100, 'Royalties cannot exceed 100%'),
  commercialUse: z.boolean(),
  derivativesAllowed: z.boolean()
})

type FormValues = z.infer<typeof formSchema>

type AiStudioProps = {
  recentAssets: IpRecord[]
  network: StoryNetwork
}

type AiGenerationResult = Awaited<ReturnType<typeof generateAiIpAsset>>

export function AiStudio({ recentAssets, network }: AiStudioProps) {
  const [result, setResult] = useState<AiGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      title: '',
      description: '',
      tags: '',
      priceBtc: 0.001,
      royaltyPercent: 10,
      commercialUse: true,
      derivativesAllowed: true
    }
  })

  const watchTags = form.watch('tags')

  const parsedTags = useMemo(() => {
    return watchTags
      ?.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }, [watchTags])

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await generateAiIpAsset({
          prompt: values.prompt,
          title: values.title,
          description: values.description,
          tags: parsedTags,
          priceBtc: values.priceBtc,
          royaltyPercent: values.royaltyPercent,
          commercialUse: values.commercialUse,
          derivativesAllowed: values.derivativesAllowed
        })
        setResult(response)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'AI generation failed'
        setError(message)
      }
    })
  }

  const generatedMedia =
    result?.assets.imageUri && resolveAssetUrl(result.assets.imageUri)

  return (
    <div className='space-y-8'>
      <div className='grid gap-6 lg:grid-cols-[1.2fr_1fr]'>
        <Card className='border-border/70 bg-card/70 shadow-md'>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <CardTitle className='flex items-center gap-2 text-2xl font-semibold'>
                  <Wand2 className='h-5 w-5 text-primary' />
                  LexLink AI Studio
                </CardTitle>
                <CardDescription className='text-sm text-muted-foreground'>
                  Generate Story-ready IP assets from a prompt, including media
                  uploads, metadata, and creator splits.
                </CardDescription>
              </div>
              <Badge
                variant='outline'
                className='border-primary/40 text-primary'
              >
                Story Protocol · {network === 'mainnet' ? 'Mainnet' : 'Aeneid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='grid gap-4 text-sm'
            >
              <fieldset className='grid gap-3'>
                <div className='space-y-2'>
                  <Label htmlFor='prompt'>Prompt for the AI agent</Label>
                  <Textarea
                    id='prompt'
                    rows={4}
                    placeholder='Design an album cover featuring neon-lit architecture reflected on rain-soaked streets...'
                    {...form.register('prompt')}
                  />
                  {form.formState.errors.prompt && (
                    <ErrorText message={form.formState.errors.prompt.message} />
                  )}
                </div>
                <div className='grid gap-3 md:grid-cols-2'>
                  <FormField
                    id='title'
                    label='Title'
                    error={form.formState.errors.title?.message}
                  >
                    <Input
                      id='title'
                      placeholder='Neon District Suite'
                      {...form.register('title')}
                    />
                  </FormField>
                  <FormField
                    id='priceBtc'
                    label='License price (BTC)'
                    error={form.formState.errors.priceBtc?.message}
                  >
                    <Input
                      id='priceBtc'
                      type='number'
                      step={0.00000001}
                      min={0.00000001}
                      inputMode='decimal'
                      {...form.register('priceBtc', { valueAsNumber: true })}
                    />
                  </FormField>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    rows={4}
                    placeholder='Summarize the story, usage context, and licensing posture.'
                    {...form.register('description')}
                  />
                  {form.formState.errors.description && (
                    <ErrorText
                      message={form.formState.errors.description.message}
                    />
                  )}
                </div>
                <div className='grid gap-3 md:grid-cols-2'>
                  <FormField
                    id='royaltyPercent'
                    label='Royalty share (%)'
                    error={form.formState.errors.royaltyPercent?.message}
                  >
                    <Input
                      id='royaltyPercent'
                      type='number'
                      min={0}
                      max={100}
                      step={0.1}
                      inputMode='decimal'
                      {...form.register('royaltyPercent', {
                        valueAsNumber: true
                      })}
                    />
                  </FormField>
                  <FormField id='tags' label='Tags'>
                    <Input
                      id='tags'
                      placeholder='synthwave, cinematic, cyberpunk'
                      {...form.register('tags')}
                    />
                    <p className='text-xs text-muted-foreground'>
                      Comma-separated list. Used for discovery in the public
                      gallery.
                    </p>
                    {parsedTags && parsedTags.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {parsedTags.map(tag => (
                          <Badge
                            key={tag}
                            variant='outline'
                            className='border-border/60 text-foreground'
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </FormField>
                </div>
                <div className='grid gap-3 md:grid-cols-2'>
                  <ToggleControl
                    label='Commercial use'
                    description='Allow the generated asset to be licensed commercially.'
                  >
                    <input
                      type='checkbox'
                      className='h-4 w-4 accent-primary'
                      {...form.register('commercialUse')}
                    />
                  </ToggleControl>
                  <ToggleControl
                    label='Derivatives allowed'
                    description='Automatically attach PIL terms that permit derivatives.'
                  >
                    <input
                      type='checkbox'
                      className='h-4 w-4 accent-primary'
                      {...form.register('derivativesAllowed')}
                    />
                  </ToggleControl>
                </div>
              </fieldset>
              <div className='flex flex-wrap items-center gap-3'>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Generating…' : 'Generate & Register'}
                </Button>
                {error && <ErrorText message={error} />}
              </div>
            </form>
          </CardContent>
          {result && (
            <CardFooter className='flex flex-col gap-4 border-t border-border/60 bg-muted/20'>
              <div className='flex w-full flex-col gap-1 text-sm'>
                <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                  Story IP Asset
                </span>
                <Link
                  href={ipAssetExplorerUrl(result.ipId, network)}
                  target='_blank'
                  rel='noreferrer'
                  className='break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
                >
                  {result.ipId}
                </Link>
              </div>
              {generatedMedia && (
                <div className='overflow-hidden rounded-lg border border-border/60 bg-background/70'>
                  <Image
                    src={generatedMedia}
                    alt={result.ipId}
                    width={960}
                    height={540}
                    className='h-48 w-full object-cover'
                  />
                </div>
              )}
              <div className='grid gap-3 md:grid-cols-2'>
                <ResultStat
                  label='SPG Token ID'
                  value={result.tokenId}
                  monospace
                />
                <ResultStat
                  label='License terms'
                  value={result.licenseTermsId}
                  monospace
                />
              </div>
            </CardFooter>
          )}
        </Card>

        <Card className='border-border/70 bg-card/70 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold text-foreground'>
              How it works
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Generate media, store metadata, register on Story, and log every
              creator.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-sm leading-relaxed text-muted-foreground'>
            <StepItem
              title='1. Prompt ingestion'
              body='The entered prompt is sent directly to OpenAI’s `gpt-image-1` model for deterministic rendering.'
            />
            <StepItem
              title='2. Asset packaging'
              body='The generated media is hashed, pinned to Pinata, and wrapped in the IPA metadata schema with creator splits and DDEX descriptors.'
            />
            <StepItem
              title='3. Story registration'
              body='LexLink mints the SPG NFT, attaches commercial PIL terms, and records the license terms ID for downstream licensing.'
            />
            <StepItem
              title='4. Compliance mirrors'
              body='Convex stores the asset with AI provenance, tags, royalty configuration, and creator roster so dashboards and the marketplace stay in sync.'
            />
          </CardContent>
        </Card>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>
              Recent AI assets
            </h2>
            <p className='text-sm text-muted-foreground'>
              Registered through the studio with royalties, provenance hashes,
              and Story identifiers.
            </p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/gallery'>View public gallery</Link>
          </Button>
        </div>
        {recentAssets.length > 0 ? (
          <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            {recentAssets.map(asset => (
              <IpAssetCard
                key={asset.ipId}
                asset={asset}
                network={network}
                highlightActions
                actionSlot={
                  <div className='space-y-2 text-xs text-muted-foreground'>
                    <p className='font-medium text-foreground'>
                      Issue a license
                    </p>
                    <p>
                      Generate a ckBTC or BTC invoice from the Licenses tab to
                      start monetizing this asset instantly.
                    </p>
                    <Button asChild size='sm' variant='outline'>
                      <Link href={`/dashboard/licenses?ip=${asset.ipId}`}>
                        Create license order
                      </Link>
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <Card className='border-dashed border-border/60 bg-muted/20 py-16 text-center'>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Your AI assets will appear here once they are generated and
                registered.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StepItem({ title, body }: { title: string; body: string }) {
  return (
    <div className='space-y-2 rounded-lg border border-border/60 bg-background/70 p-4'>
      <p className='text-sm font-semibold text-foreground'>{title}</p>
      <p className='text-sm text-muted-foreground'>{body}</p>
    </div>
  )
}

function FormField({
  id,
  label,
  error,
  children
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <ErrorText message={error} /> : null}
    </div>
  )
}

function ToggleControl({
  label,
  description,
  children
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-start gap-2 rounded-lg border border-border/60 bg-background/70 p-3'>
      {children}
      <div className='space-y-1'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {label}
        </p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
    </div>
  )
}

function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className='text-xs text-destructive'>{message}</p>
}

function ResultStat({
  label,
  value,
  monospace
}: {
  label: string
  value: string
  monospace?: boolean
}) {
  return (
    <div className='space-y-1 rounded-lg border border-border/60 bg-background/70 p-3 text-xs'>
      <p className='text-[10px] uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <p className={monospace ? 'break-all font-mono text-[11px]' : ''}>
        {value}
      </p>
    </div>
  )
}

import { IPFS_GATEWAYS } from '@/lib/ipfs-gateways'

function resolveAssetUrl(uri: string) {
  if (!uri) return ''
  const sources = buildGatewaySources(uri)
  return sources[0] ?? uri
}

function buildGatewaySources(uri: string) {
  const urls = new Set<string>()
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '').replace(/^\/+/, '')
    IPFS_GATEWAYS.forEach(gateway => urls.add(`${gateway}${cid}`))
  } else if (uri.includes('/ipfs/')) {
    const cidPath = uri.substring(uri.indexOf('/ipfs/') + '/ipfs/'.length)
    IPFS_GATEWAYS.forEach(gateway => urls.add(`${gateway}${cidPath}`))
  }
  urls.add(uri)
  return Array.from(urls)
}
