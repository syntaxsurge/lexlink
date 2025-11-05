'use client'

import type { ComponentProps, ReactNode } from 'react'

import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { registerIpAsset } from '@/app/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

const storyNetwork: StoryNetwork =
  process.env.NEXT_PUBLIC_STORY_NETWORK === 'mainnet' ? 'mainnet' : 'aeneid'

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  createdAt: z.string().min(1, 'Select the creation date'),
  imageUrl: z
    .string()
    .min(1, 'Provide a cover image URL')
    .refine(isUrlOrIpfs, 'Provide a valid URL or ipfs:// CID'),
  mediaUrl: z
    .string()
    .min(1, 'Provide the media URL')
    .refine(isUrlOrIpfs, 'Provide a valid URL or ipfs:// CID'),
  mediaType: z.string().min(3, 'Provide a MIME type (e.g. audio/mpeg)'),
  priceBtc: z
    .number({ required_error: 'Set a license price in BTC' })
    .min(0.00000001, 'Price must be at least 0.00000001 BTC'),
  royaltyPercent: z
    .number({ required_error: 'Set the royalty share' })
    .min(0, 'Royalties cannot be negative')
    .max(100, 'Royalties cannot exceed 100%'),
  creatorName: z.string().min(2, 'Creator name is required'),
  creatorAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Creator address must be a 0x-prefixed EVM address'),
  ipMetadataUri: z
    .string()
    .min(1, 'Provide the IP metadata URI')
    .refine(isUrlOrIpfs, 'Provide a valid URL or ipfs:// CID'),
  nftMetadataUri: z
    .string()
    .min(1, 'Provide the NFT metadata URI')
    .refine(isUrlOrIpfs, 'Provide a valid URL or ipfs:// CID')
})

type FormValues = z.infer<typeof formSchema>

export function RegisterIpForm() {
  const [result, setResult] = useState<null | {
    ipId: string
    tokenId: string
    licenseTermsId: string
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      createdAt: defaultDateTimeLocal(),
      imageUrl: '',
      mediaUrl: '',
      mediaType: 'audio/mpeg',
      priceBtc: 0.001,
      royaltyPercent: 10,
      creatorName: '',
      creatorAddress: '',
      ipMetadataUri: '',
      nftMetadataUri: ''
    }
  })

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const createdAtIso = new Date(values.createdAt).toISOString()
        const priceSats = Math.round(values.priceBtc * 100_000_000)
        const royaltyBps = Math.round(values.royaltyPercent * 100)

        const response = await registerIpAsset({
          title: values.title,
          description: values.description,
          createdAt: createdAtIso,
          imageUrl: resolveUrl(values.imageUrl),
          mediaUrl: resolveUrl(values.mediaUrl),
          mediaType: values.mediaType,
          priceSats,
          royaltyBps,
          ipMetadataUri: resolveUrl(values.ipMetadataUri),
          nftMetadataUri: resolveUrl(values.nftMetadataUri),
          creators: [
            {
              name: values.creatorName,
              address: values.creatorAddress as `0x${string}`,
              contributionPercent: 100
            }
          ]
        })
        setResult({
          ipId: response.ipId,
          tokenId: response.tokenId,
          licenseTermsId: response.licenseTermsId
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error occurred'
        setError(message)
      }
    })
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = form

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='grid gap-3 md:grid-cols-2'>
          <Field label='Title' error={errors.title?.message}>
            <Input
              id='title'
              placeholder='Midnight Marriage'
              {...register('title')}
            />
          </Field>
          <Field label='Creation timestamp' error={errors.createdAt?.message}>
            <Input
              id='createdAt'
              type='datetime-local'
              {...register('createdAt')}
            />
          </Field>
        </div>

        <Field label='Description' error={errors.description?.message}>
          <Textarea
            id='description'
            rows={4}
            placeholder='Describe the work, collaborators, and licensing intent.'
            {...register('description')}
          />
          <Hint>
            This copy appears in your IP metadata bundle and Story Protocol
            notes.
          </Hint>
        </Field>

        <div className='grid gap-3 md:grid-cols-2'>
          <Field label='Cover image URL' error={errors.imageUrl?.message}>
            <Input
              id='imageUrl'
              placeholder='https://cdn.example.com/cover.jpg or ipfs://CID'
              {...register('imageUrl')}
            />
          </Field>
          <Field label='Media URL' error={errors.mediaUrl?.message}>
            <Input
              id='mediaUrl'
              placeholder='https://cdn.example.com/audio.mp3 or ipfs://CID'
              {...register('mediaUrl')}
            />
          </Field>
          <Field label='Media type (MIME)' error={errors.mediaType?.message}>
            <Input
              id='mediaType'
              placeholder='audio/mpeg'
              {...register('mediaType')}
            />
          </Field>
          <Field label='License price (BTC)' error={errors.priceBtc?.message}>
            <Input
              id='priceBtc'
              type='number'
              min={0.00000001}
              step={0.00000001}
              placeholder='0.0025'
              inputMode='decimal'
              {...register('priceBtc', { valueAsNumber: true })}
            />
            <Hint>
              Buyers pay this amount in BTC. We convert it to satoshis for Story
              Protocol.
            </Hint>
          </Field>
          <Field
            label='Royalty share (%)'
            error={errors.royaltyPercent?.message}
          >
            <Input
              id='royaltyPercent'
              type='number'
              min={0}
              max={100}
              step={0.1}
              placeholder='10'
              inputMode='decimal'
              {...register('royaltyPercent', { valueAsNumber: true })}
            />
            <Hint>
              Percentage of downstream revenue routed back to the licensor.
            </Hint>
          </Field>
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          <Field label='Creator name' error={errors.creatorName?.message}>
            <Input
              id='creatorName'
              placeholder='LexLink Demo'
              {...register('creatorName')}
            />
          </Field>
          <Field
            label='Creator wallet'
            error={errors.creatorAddress?.message}
          >
            <Input
              id='creatorAddress'
              placeholder='0xabc123…'
              {...register('creatorAddress')}
            />
          </Field>
          <Field label='IP metadata URI' error={errors.ipMetadataUri?.message}>
            <Input
              id='ipMetadataUri'
              placeholder='https://cdn.example.com/ip.json or ipfs://CID'
              {...register('ipMetadataUri')}
            />
          </Field>
          <Field
            label='NFT metadata URI'
            error={errors.nftMetadataUri?.message}
          >
            <Input
              id='nftMetadataUri'
              placeholder='https://cdn.example.com/nft.json or ipfs://CID'
              {...register('nftMetadataUri')}
            />
          </Field>
        </div>

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Registering…' : 'Register IP Asset'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>

      {result && (
        <dl className='grid gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>IP ID</dt>
            <dd className='break-all font-mono text-xs'>{result.ipId}</dd>
            <div className='flex flex-wrap gap-2 pt-1'>
              <ResultLink href={ipAssetExplorerUrl(result.ipId, storyNetwork)}>
                View in Story IP Explorer
              </ResultLink>
              <ResultLink
                href={ipAccountOnBlockExplorer(result.ipId, storyNetwork)}
                variant='outline'
              >
                View on StoryScan
              </ResultLink>
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              SPG Token ID
            </dt>
            <dd className='font-mono text-xs'>{result.tokenId}</dd>
          </div>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>
              License Terms ID
            </dt>
            <dd className='font-mono text-xs'>{result.licenseTermsId}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}

type FieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-foreground'>{label}</Label>
      {children}
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className='text-xs text-muted-foreground'>{children}</p>
}

type ResultLinkProps = {
  href: string
  variant?: ComponentProps<typeof Button>['variant']
  children: ReactNode
}

function ResultLink({ href, variant = 'outline', children }: ResultLinkProps) {
  return (
    <Button asChild size='sm' variant={variant} className='text-xs'>
      <a href={href} target='_blank' rel='noreferrer'>
        {children}
      </a>
    </Button>
  )
}

function defaultDateTimeLocal() {
  const iso = new Date().toISOString()
  return iso.slice(0, 16)
}

function resolveUrl(value: string) {
  if (value.startsWith('ipfs://')) {
    return value.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return value
}

function isUrlOrIpfs(value: string) {
  if (value.startsWith('ipfs://')) {
    return value.length > 'ipfs://'.length
  }
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
