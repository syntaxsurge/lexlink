'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm
} from 'react-hook-form'
import { z } from 'zod'

import { registerIpAsset } from '@/app/dashboard/actions'
import { AdvancedCreators } from '@/components/app/advanced-creators'
import {
  AdvancedRelationships,
  RELATIONSHIP_TYPE_VALUES
} from '@/components/app/advanced-relationships'
import { MediaTypeChip } from '@/components/app/media-type-chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ipAccountOnBlockExplorer,
  ipAssetExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'
import { detectMimeFromUrl } from '@/lib/media-type'

const storyNetwork: StoryNetwork =
  process.env.NEXT_PUBLIC_STORY_NETWORK === 'mainnet' ? 'mainnet' : 'aeneid'

const creatorSchema = z.object({
  name: z
    .string({ required_error: 'Creator name is required' })
    .trim()
    .min(2, 'Creator name is required')
    .max(120, 'Creator names are limited to 120 characters'),
  wallet: z
    .string({ required_error: 'Creator wallet is required' })
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Creator wallet must be an 0x-prefixed address'),
  role: z
    .string()
    .trim()
    .max(120, 'Creator roles are limited to 120 characters')
    .optional(),
  pct: z
    .number({
      invalid_type_error: 'Contribution must be a number'
    })
    .min(0, 'Contribution must be 0 or greater')
    .max(100, 'Contribution cannot exceed 100')
})

const RELATIONSHIP_ENUM_VALUES = RELATIONSHIP_TYPE_VALUES as [
  string,
  ...string[]
]

const attributeSchema = z.object({
  traitType: z.string().min(1, 'Trait name is required'),
  value: z.string().min(1, 'Trait value is required')
})

const relationshipSchema = z.object({
  parentIpId: z
    .string({ required_error: 'Parent IP ID is required' })
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Parent IP ID must be an 0x-prefixed address'),
  type: z.enum(RELATIONSHIP_ENUM_VALUES, {
    errorMap: () => ({ message: 'Select a valid relationship type' })
  })
})

const formSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters'),
    createdAt: z.string().min(1, 'Select the creation date'),
    imageUrl: z.string().optional(),
    imageFile: z
      .custom<FileList | undefined>(
        value => value === undefined || value instanceof FileList
      )
      .optional(),
    mediaUrl: z.string().optional(),
    mediaFile: z
      .custom<FileList | undefined>(
        value => value === undefined || value instanceof FileList
      )
      .optional(),
    mediaType: z
      .string()
      .trim()
      .max(200, 'MIME types are limited to 200 characters')
      .optional(),
    priceBtc: z
      .number({ required_error: 'Set a license price in BTC' })
      .min(0.00000001, 'Price must be at least 0.00000001 BTC'),
    royaltyPercent: z
      .number({ required_error: 'Set the royalty share' })
      .min(0, 'Royalties cannot be negative')
      .max(100, 'Royalties cannot exceed 100%'),
    commercialUse: z.boolean(),
    derivativesAllowed: z.boolean(),
    creators: z
      .array(creatorSchema)
      .min(1, 'Add at least one creator')
      .optional(),
    relationships: z.array(relationshipSchema).optional(),
    nftAttributes: z.array(attributeSchema).optional(),
    customMetadata: z.string().optional()
  })
  .superRefine((values, ctx) => {
    const imageUrl = values.imageUrl?.trim() ?? ''
    const hasImageFile =
      values.imageFile instanceof FileList && values.imageFile.length > 0
    if (!hasImageFile && !imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload a cover image or provide a URL',
        path: ['imageUrl']
      })
    }
    if (imageUrl && !isUrlOrIpfs(imageUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide a valid URL or ipfs:// CID',
        path: ['imageUrl']
      })
    }

    const mediaUrl = values.mediaUrl?.trim() ?? ''
    const hasMediaFile =
      values.mediaFile instanceof FileList && values.mediaFile.length > 0
    if (!hasMediaFile && !mediaUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload the primary media or provide a URL',
        path: ['mediaUrl']
      })
    }
    if (mediaUrl && !isUrlOrIpfs(mediaUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide a valid URL or ipfs:// CID',
        path: ['mediaUrl']
      })
    }

    const creatorEntries = (values.creators ?? []).filter(
      creator =>
        (creator.name && creator.name.trim().length > 0) ||
        (creator.wallet && creator.wallet.trim().length > 0) ||
        (creator.role && creator.role.trim().length > 0)
    )
    if (creatorEntries.length > 0) {
      const contributions = creatorEntries.map(creator => creator.pct)
      if (contributions.some(value => typeof value !== 'number')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Set a contribution percentage for each creator',
          path: ['creators']
        })
      } else {
        const total = contributions.reduce(
          (sum, value) => sum + (value ?? 0),
          0
        )
        if (Math.abs(total - 100) > 0.001) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Creator contributions must total 100%',
            path: ['creators']
          })
        }
      }
    }

    const custom = values.customMetadata?.trim()
    if (custom) {
      try {
        const parsed = JSON.parse(custom)
        if (parsed === null || typeof parsed !== 'object') {
          throw new Error('Metadata must be a JSON object')
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof Error
              ? error.message
              : 'Enter valid JSON for custom metadata',
          path: ['customMetadata']
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

export function RegisterIpForm() {
  const [result, setResult] = useState<
    | null
    | {
        ipId: string
        tokenId: string
        licenseTermsId: string
        creators: Array<{
          name: string
          address: string
          role?: string
          contributionPercent: number
        }>
        relationships: Array<{
          parentIpId: string
          type: string
        }>
      }
  >(null)
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
      mediaType: 'application/octet-stream',
      priceBtc: 0.001,
      royaltyPercent: 10,
      commercialUse: true,
      derivativesAllowed: true,
      creators: [],
      relationships: [],
      nftAttributes: [],
      customMetadata: ''
    }
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = form

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute
  } = useFieldArray({
    control,
    name: 'nftAttributes'
  })

  const imageFileList = watch('imageFile') as FileList | undefined
  const mediaFileList = watch('mediaFile') as FileList | undefined
  const mediaUrlValue = watch('mediaUrl') as string | undefined
  const mediaTypeValue = (watch('mediaType') as string | undefined) ?? ''

  const [mediaTypeSource, setMediaTypeSource] = useState<'auto' | 'manual'>(
    'auto'
  )
  const [detectedMime, setDetectedMime] = useState('application/octet-stream')
  const [isDetectingMime, setIsDetectingMime] = useState(false)

  const applyAutoMime = useCallback(
    (mime: string) => {
      const normalized = mime?.trim() || 'application/octet-stream'
      setDetectedMime(prev => (prev === normalized ? prev : normalized))
      if (mediaTypeSource === 'auto' && mediaTypeValue !== normalized) {
        setValue('mediaType', normalized, { shouldDirty: true })
      }
    },
    [mediaTypeSource, mediaTypeValue, setValue]
  )

  useEffect(() => {
    const file =
      mediaFileList instanceof FileList && mediaFileList.length > 0
        ? mediaFileList[0]
        : null
    if (file?.type) {
      applyAutoMime(file.type)
      return
    }
    if (!mediaUrlValue) {
      applyAutoMime('application/octet-stream')
    }
  }, [mediaFileList, mediaUrlValue, applyAutoMime])

  useEffect(() => {
    const trimmed = mediaUrlValue?.trim()
    if (
      !trimmed ||
      !isUrlOrIpfs(trimmed) ||
      (mediaFileList instanceof FileList && mediaFileList.length > 0)
    ) {
      setIsDetectingMime(false)
      return
    }
    let cancelled = false
    setIsDetectingMime(true)
    detectMimeFromUrl(trimmed)
      .then(mime => {
        if (cancelled) return
        applyAutoMime(mime)
      })
      .catch(() => {
        if (cancelled) return
        applyAutoMime('application/octet-stream')
      })
      .finally(() => {
        if (cancelled) return
        setIsDetectingMime(false)
      })
    return () => {
      cancelled = true
    }
  }, [mediaUrlValue, mediaFileList, applyAutoMime])

  const handleMimeOverride = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    setMediaTypeSource('manual')
    if (mediaTypeValue !== trimmed) {
      setValue('mediaType', trimmed, { shouldDirty: true })
    }
  }

  const handleMimeReset = () => {
    setMediaTypeSource('auto')
    if (mediaTypeValue !== detectedMime) {
      setValue('mediaType', detectedMime, { shouldDirty: true })
    }
  }

  const onSubmit = (values: FormValues) => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const priceSats = Math.round(values.priceBtc * 100_000_000)
        const royaltyBps = Math.round(values.royaltyPercent * 100)

        const imageInput = await buildAssetInput({
          fileList: values.imageFile,
          url: values.imageUrl
        })
        const mediaInput = await buildAssetInput({
          fileList: values.mediaFile,
          url: values.mediaUrl
        })

        const attributes = (values.nftAttributes ?? []).filter(
          attribute => attribute.traitType.trim() && attribute.value.trim()
        )

        const creatorEntries = (values.creators ?? [])
          .map(creator => ({
            name: creator.name.trim(),
            wallet: creator.wallet.trim(),
            role: creator.role?.trim() ?? '',
            contributionPercent: creator.pct
          }))
          .filter(creator => creator.name && creator.wallet)

        const payloadCreators = creatorEntries.map(creator => ({
          name: creator.name,
          address: creator.wallet,
          role: creator.role || undefined,
          contributionPercent: creator.contributionPercent
        }))

        const relationshipEntries = (values.relationships ?? [])
          .map(rel => ({
            parentIpId: rel.parentIpId.trim(),
            type: rel.type
          }))
          .filter(rel => rel.parentIpId && rel.type)

        const customMetadata = parseOptionalJsonRecord(
          values.customMetadata
        )

        const normalizedMediaType =
          values.mediaType?.trim() || detectedMime || 'application/octet-stream'

        const response = await registerIpAsset({
          title: values.title.trim(),
          description: values.description.trim(),
          createdAt: new Date(values.createdAt).toISOString(),
          image: imageInput,
          media: mediaInput,
          mediaType: normalizedMediaType,
          priceSats,
          royaltyBps,
          commercialUse: values.commercialUse,
          derivativesAllowed: values.derivativesAllowed,
          creators: payloadCreators,
          nftAttributes:
            attributes.length > 0
              ? attributes.map(attribute => ({
                  traitType: attribute.traitType.trim(),
                  value: attribute.value.trim()
                }))
              : undefined,
          relationships:
            relationshipEntries.length > 0 ? relationshipEntries : undefined,
          customMetadata
        })

        setResult({
          ipId: response.ipId,
          tokenId: response.tokenId,
          licenseTermsId: response.licenseTermsId,
          creators: payloadCreators,
          relationships: relationshipEntries
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error occurred'
        setError(message)
      }
    })
  }

  const imageFileField = register('imageFile')
  const mediaFileField = register('mediaFile')
  const mediaUrlField = register('mediaUrl', {
    onChange: () => {
      setMediaTypeSource('auto')
    }
  })

  useEffect(() => {
    register('mediaType')
  }, [register])
  const imageFileName =
    imageFileList && imageFileList.length > 0
      ? (imageFileList[0]?.name ?? null)
      : null
  const mediaFileName =
    mediaFileList && mediaFileList.length > 0
      ? (mediaFileList[0]?.name ?? null)
      : null

  return (
    <FormProvider {...form}>
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
          <Field label='Cover image' error={errors.imageUrl?.message}>
            <div className='space-y-2'>
              <Input
                id='imageFile'
                type='file'
                accept='image/*'
                {...imageFileField}
                onChange={event => {
                  imageFileField.onChange(event)
                  if (event.target.files && event.target.files.length === 0) {
                    event.target.value = ''
                  }
                }}
              />
              <Input
                id='imageUrl'
                placeholder='https://cdn.example.com/cover.jpg or ipfs://CID'
                {...register('imageUrl')}
              />
              {imageFileName && (
                <p className='text-xs text-muted-foreground'>
                  Selected file: {imageFileName}
                </p>
              )}
              <Hint>
                Upload an image or paste a hosted URL. We store the file on IPFS
                and record the hash automatically.
              </Hint>
            </div>
          </Field>
          <Field label='Primary media' error={errors.mediaUrl?.message}>
            <div className='space-y-2'>
              <Input
                id='mediaFile'
                type='file'
                accept='audio/*,video/*'
                {...mediaFileField}
                onChange={event => {
                  mediaFileField.onChange(event)
                  setMediaTypeSource('auto')
                  if (event.target.files && event.target.files.length === 0) {
                    event.target.value = ''
                  }
                }}
              />
              <Input
                id='mediaUrl'
                placeholder='https://cdn.example.com/audio.mp3 or ipfs://CID'
                {...mediaUrlField}
              />
              {mediaFileName && (
                <p className='text-xs text-muted-foreground'>
                  Selected file: {mediaFileName}
                </p>
              )}
              <Hint>
                Supply the master audio/video. We fetch it, upload to IPFS, and
                compute Story-compatible hashes.
              </Hint>
              <MediaTypeChip
                value={mediaTypeValue}
                detectedValue={detectedMime}
                pending={isDetectingMime}
                onChange={handleMimeOverride}
                onReset={handleMimeReset}
              />
              {errors.mediaType?.message && (
                <p className='text-xs text-destructive'>
                  {errors.mediaType.message}
                </p>
              )}
            </div>
          </Field>
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
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
          <Field label='Commercial use'>
            <Controller
              control={control}
              name='commercialUse'
              render={({ field }) => (
                <label className='flex items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 accent-primary'
                    checked={field.value}
                    onChange={event => field.onChange(event.target.checked)}
                    ref={field.ref}
                  />
                  <span className='text-muted-foreground'>
                    Enable commercial licensing and Story attestation.
                  </span>
                </label>
              )}
            />
          </Field>
          <Field label='Derivatives allowed'>
            <Controller
              control={control}
              name='derivativesAllowed'
              render={({ field }) => (
                <label className='flex items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 accent-primary'
                    checked={field.value}
                    onChange={event => field.onChange(event.target.checked)}
                    ref={field.ref}
                  />
                  <span className='text-muted-foreground'>
                    Allow derivative works under the PIL terms.
                  </span>
                </label>
              )}
            />
          </Field>
        </div>

        <details className='rounded-lg border border-border bg-muted/40 p-4 text-sm'>
          <summary className='cursor-pointer text-sm font-semibold text-foreground'>
            Advanced metadata
          </summary>
          <div className='mt-3 space-y-6'>
            <AdvancedCreators className='text-sm' />

            <AdvancedRelationships className='text-sm' />

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Media type override
              </p>
              <p className='text-xs text-muted-foreground'>
                Use the change control above whenever the auto-detected MIME type needs correction. Leave it untouched to keep the detected value.
              </p>
            </div>

            <div className='space-y-3'>
              <p className='text-xs text-muted-foreground'>
                Add optional NFT traits. Leave blank to skip.
              </p>
              {attributeFields.map((fieldItem, index) => {
                const traitError =
                  errors.nftAttributes?.[index]?.traitType?.message
                const valueError = errors.nftAttributes?.[index]?.value?.message
                return (
                  <div
                    key={fieldItem.id}
                    className='grid gap-2 md:grid-cols-[1fr_1fr_auto]'
                  >
                    <div>
                      <Input
                        placeholder='Trait name (e.g., Instrument)'
                        {...register(`nftAttributes.${index}.traitType` as const)}
                      />
                      {traitError && (
                        <p className='text-xs text-destructive'>{traitError}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder='Trait value (e.g., Piano)'
                        {...register(`nftAttributes.${index}.value` as const)}
                      />
                      {valueError && (
                        <p className='text-xs text-destructive'>{valueError}</p>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeAttribute(index)}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => appendAttribute({ traitType: '', value: '' })}
              >
                Add attribute
              </Button>
            </div>

            <div className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Custom metadata JSON
              </Label>
              <Textarea
                rows={4}
                placeholder='{ "genre": "Ambient" }'
                {...register('customMetadata')}
              />
              {errors.customMetadata?.message && (
                <p className='text-xs text-destructive'>
                  {errors.customMetadata.message}
                </p>
              )}
              <p className='text-xs text-muted-foreground'>
                Optional free-form metadata that merges into the IP manifest. Provide a JSON object only when downstream services expect extra keys.
              </p>
            </div>
          </div>
        </details>

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Registering…' : 'Register IP Asset'}
          </Button>
          {error && <span className='text-sm text-destructive'>{error}</span>}
        </div>
      </form>

      {result && (
        <dl className='grid gap-4 rounded-lg border border-border bg-muted/40 p-4 text-sm'>
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
          {result.creators.length > 0 && (
            <div className='space-y-2'>
              <dt className='font-semibold text-muted-foreground'>Creators</dt>
              <div className='space-y-2'>
                {result.creators.map((creator, index) => (
                  <div
                    key={`${creator.address}-${index}`}
                    className='rounded-md border border-border/60 bg-background/60 p-3 text-xs'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='font-medium text-foreground'>{creator.name}</span>
                      <span className='font-mono text-muted-foreground'>
                        {creator.contributionPercent}%
                      </span>
                    </div>
                    <div className='mt-1 break-all font-mono text-[10px] text-muted-foreground'>
                      {creator.address}
                    </div>
                    {creator.role && (
                      <div className='mt-1 text-[10px] uppercase tracking-wide text-muted-foreground'>
                        Role: {creator.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.relationships.length > 0 && (
            <div className='space-y-2'>
              <dt className='font-semibold text-muted-foreground'>Lineage</dt>
              <div className='space-y-2'>
                {result.relationships.map((relationship, index) => (
                  <div
                    key={`${relationship.parentIpId}-${index}`}
                    className='rounded-md border border-border/60 bg-background/60 p-3 text-xs'
                  >
                    <div className='font-medium text-foreground'>{relationship.type}</div>
                    <div className='mt-1 break-all font-mono text-[10px] text-muted-foreground'>
                      {relationship.parentIpId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </dl>
      )}
      </div>
    </FormProvider>
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

async function buildAssetInput({
  fileList,
  url
}: {
  fileList?: FileList
  url?: string | null
}) {
  const file = fileList && fileList.length > 0 ? fileList[0] : undefined
  if (file) {
    return {
      kind: 'file' as const,
      file: await serializeFile(file)
    }
  }

  const trimmed = url?.trim()
  if (trimmed) {
    return {
      kind: 'url' as const,
      url: trimmed
    }
  }

  throw new Error('Asset source is required')
}

async function serializeFile(file: File) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    data: await fileToDataUrl(file)
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Unable to read file'))
      }
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file'))
    }
    reader.readAsDataURL(file)
  })
}

function parseOptionalJsonRecord(input?: string | null) {
  if (!input) {
    return undefined
  }
  const trimmed = input.trim()
  if (!trimmed) {
    return undefined
  }
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // Validation handles surfacing errors to the user.
  }
  return undefined
}

function defaultDateTimeLocal() {
  const iso = new Date().toISOString()
  return iso.slice(0, 16)
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
