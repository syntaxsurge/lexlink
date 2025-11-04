'use client'

import { useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { registerIpAsset } from '@/app/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  createdAt: z.string().min(4),
  imageUrl: z.string().url(),
  mediaUrl: z.string().url(),
  mediaType: z.string().min(3),
  priceSats: z.coerce.number().int().positive(),
  royaltyBps: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000, 'Royalty BPS cannot exceed 10,000 (100%)'),
  creatorName: z.string().min(2),
  creatorAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Creator address must be 0x-prefixed'),
  ipMetadataUri: z.string().url(),
  nftMetadataUri: z.string().url()
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
      createdAt: new Date().toISOString()
    }
  })

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const response = await registerIpAsset({
          title: values.title,
          description: values.description,
          createdAt: values.createdAt,
          imageUrl: values.imageUrl,
          mediaUrl: values.mediaUrl,
          mediaType: values.mediaType,
          priceSats: values.priceSats,
          royaltyBps: values.royaltyBps,
          ipMetadataUri: values.ipMetadataUri,
          nftMetadataUri: values.nftMetadataUri,
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

  return (
    <div className='space-y-6'>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <div className='grid gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' {...form.register('title')} />
            {form.formState.errors.title && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='createdAt'>Created At</Label>
            <Input id='createdAt' {...form.register('createdAt')} />
            {form.formState.errors.createdAt && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.createdAt.message}
              </p>
            )}
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            rows={4}
            {...form.register('description')}
          />
          {form.formState.errors.description && (
            <p className='text-sm text-destructive'>
              {form.formState.errors.description.message}
            </p>
          )}
        </div>
        <div className='grid gap-3 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='imageUrl'>Cover Image URL</Label>
            <Input id='imageUrl' {...form.register('imageUrl')} />
            {form.formState.errors.imageUrl && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.imageUrl.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='mediaUrl'>Media URL</Label>
            <Input id='mediaUrl' {...form.register('mediaUrl')} />
            {form.formState.errors.mediaUrl && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.mediaUrl.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='mediaType'>Media Type (MIME)</Label>
            <Input id='mediaType' {...form.register('mediaType')} />
            {form.formState.errors.mediaType && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.mediaType.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='priceSats'>License Price (sats)</Label>
            <Input
              id='priceSats'
              type='number'
              min={1}
              {...form.register('priceSats', { valueAsNumber: true })}
            />
            {form.formState.errors.priceSats && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.priceSats.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='royaltyBps'>Royalty (BPS)</Label>
            <Input
              id='royaltyBps'
              type='number'
              min={0}
              max={10000}
              {...form.register('royaltyBps', { valueAsNumber: true })}
            />
            {form.formState.errors.royaltyBps && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.royaltyBps.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='creatorName'>Creator Name</Label>
            <Input id='creatorName' {...form.register('creatorName')} />
            {form.formState.errors.creatorName && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.creatorName.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='creatorAddress'>Creator Wallet</Label>
            <Input id='creatorAddress' {...form.register('creatorAddress')} />
            {form.formState.errors.creatorAddress && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.creatorAddress.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='ipMetadataUri'>IP Metadata URI</Label>
            <Input id='ipMetadataUri' {...form.register('ipMetadataUri')} />
            {form.formState.errors.ipMetadataUri && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.ipMetadataUri.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='nftMetadataUri'>NFT Metadata URI</Label>
            <Input id='nftMetadataUri' {...form.register('nftMetadataUri')} />
            {form.formState.errors.nftMetadataUri && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.nftMetadataUri.message}
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Publishing…' : 'Register IP Asset'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>
      {result && (
        <dl className='grid gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <div className='flex flex-col gap-1'>
            <dt className='font-semibold text-muted-foreground'>IP ID</dt>
            <dd className='break-all font-mono text-xs'>{result.ipId}</dd>
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
