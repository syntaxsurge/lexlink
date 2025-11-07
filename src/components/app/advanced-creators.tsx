'use client'

import { useEffect } from 'react'

import { useFieldArray, useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type AdvancedCreatorsProps = {
  fieldName?: string
  className?: string
}

export function AdvancedCreators({
  fieldName = 'creators',
  className
}: AdvancedCreatorsProps) {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext()

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: fieldName as 'creators'
  })

  const allErrors = (errors as Record<string, any>)[fieldName]
  const entryErrors = Array.isArray(allErrors)
    ? (allErrors as Array<Record<string, { message?: string }>>)
    : []
  const aggregateError = !Array.isArray(allErrors)
    ? ((allErrors?.message as string | undefined) ??
      (allErrors?.root?.message as string | undefined))
    : undefined

  useEffect(() => {
    if (fields.length === 0) {
      replace([
        {
          name: '',
          wallet: '',
          role: '',
          pct: 100,
          description: '',
          socialPlatform: '',
          socialUrl: ''
        }
      ])
    }
  }, [fields.length, replace])

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium text-foreground'>Creators</p>
          <p className='text-xs text-muted-foreground'>
            Provide the on-chain contributors for this IP Asset. Percentages
            must total 100.
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='secondary'
          onClick={() =>
            append({
              name: '',
              wallet: '',
              role: '',
              pct: fields.length === 0 ? 100 : 0,
              description: '',
              socialPlatform: '',
              socialUrl: ''
            })
          }
        >
          Add creator
        </Button>
      </div>

      <div className='space-y-4'>
        {fields.map((field, index) => {
          const fieldErrors = entryErrors[index]

          return (
            <div
              key={field.id}
              className='grid gap-3 rounded-lg border border-border/60 bg-card/60 p-3 md:grid-cols-12'
            >
              <div className='space-y-1 md:col-span-3'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Name
                </Label>
                <Input
                  placeholder='LexLink Demo'
                  {...register(`${fieldName}.${index}.name` as const)}
                />
                {fieldErrors?.name?.message && (
                  <ErrorText message={fieldErrors.name.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-4'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Wallet (0x address)
                </Label>
                <Input
                  placeholder='0x…'
                  {...register(`${fieldName}.${index}.wallet` as const)}
                />
                {fieldErrors?.wallet?.message && (
                  <ErrorText message={fieldErrors.wallet.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-3'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Role
                </Label>
                <Input
                  placeholder='Composer'
                  {...register(`${fieldName}.${index}.role` as const)}
                />
                {fieldErrors?.role?.message && (
                  <ErrorText message={fieldErrors.role.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-2'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Contribution %
                </Label>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  step='0.1'
                  {...register(`${fieldName}.${index}.pct` as const, {
                    valueAsNumber: true
                  })}
                />
                {fieldErrors?.pct?.message && (
                  <ErrorText message={fieldErrors.pct.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-12'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Creator description
                </Label>
                <Textarea
                  rows={2}
                  placeholder='Optional context about this contributor or agent.'
                  {...register(`${fieldName}.${index}.description` as const)}
                />
                {fieldErrors?.description?.message && (
                  <ErrorText message={fieldErrors.description.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-3'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Social platform
                </Label>
                <Input
                  placeholder='Website, Farcaster, X…'
                  {...register(`${fieldName}.${index}.socialPlatform` as const)}
                />
                {fieldErrors?.socialPlatform?.message && (
                  <ErrorText message={fieldErrors.socialPlatform.message} />
                )}
              </div>
              <div className='space-y-1 md:col-span-5'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Social URL
                </Label>
                <Input
                  placeholder='https://example.com/creator'
                  {...register(`${fieldName}.${index}.socialUrl` as const)}
                />
                {fieldErrors?.socialUrl?.message && (
                  <ErrorText message={fieldErrors.socialUrl.message} />
                )}
              </div>
              <div className='flex justify-end md:col-span-12'>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      {aggregateError ? <ErrorText message={aggregateError} /> : null}
    </div>
  )
}

function ErrorText({ message }: { message: string }) {
  return <p className='text-xs text-destructive'>{message}</p>
}
