'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STORY_RELATIONSHIPS = [
  'APPEARS_IN',
  'BELONGS_TO',
  'PART_OF',
  'CONTINUES_FROM',
  'LEADS_TO',
  'FORESHADOWS',
  'CONFLICTS_WITH',
  'RESULTS_IN',
  'DEPENDS_ON',
  'SETS_UP',
  'FOLLOWS_FROM',
  'REVEALS_THAT',
  'DEVELOPS_OVER',
  'INTRODUCES',
  'RESOLVES_IN',
  'CONNECTS_TO',
  'RELATES_TO',
  'TRANSITIONS_FROM',
  'INTERACTED_WITH',
  'LEADS_INTO',
  'PARALLEL'
] as const

const AI_RELATIONSHIPS = [
  'TRAINED_ON',
  'FINETUNED_FROM',
  'GENERATED_FROM',
  'REQUIRES_DATA',
  'BASED_ON',
  'INFLUENCES',
  'CREATES',
  'UTILIZES',
  'DERIVED_FROM',
  'PRODUCES',
  'MODIFIES',
  'REFERENCES',
  'OPTIMIZED_BY',
  'INHERITS',
  'APPLIES_TO',
  'COMBINES'
] as const

export const RELATIONSHIP_GROUPS = [
  { label: 'Story relationships', values: STORY_RELATIONSHIPS },
  { label: 'AI relationships', values: AI_RELATIONSHIPS }
] as const

export const RELATIONSHIP_TYPE_VALUES = RELATIONSHIP_GROUPS.flatMap(group => [
  ...group.values
]) as readonly string[]

type AdvancedRelationshipsProps = {
  fieldName?: string
  className?: string
}

export function AdvancedRelationships({
  fieldName = 'relationships',
  className
}: AdvancedRelationshipsProps) {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName as 'relationships'
  })

  const relationshipErrors = (errors as Record<string, any>)[fieldName]

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium text-foreground'>
            Lineage (optional)
          </p>
          <p className='text-xs text-muted-foreground'>
            Link this IP Asset to existing parents to surface provenance in
            Story Explorer.
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='secondary'
          onClick={() =>
            append({
              parentIpId: '',
              type: 'APPEARS_IN'
            })
          }
        >
          Add relationship
        </Button>
      </div>

      <div className='space-y-4'>
        {fields.map((field, index) => {
          const entryErrors = Array.isArray(relationshipErrors)
            ? relationshipErrors[index]
            : undefined

          return (
            <div
              key={field.id}
              className='grid gap-3 rounded-lg border border-border/60 bg-card/60 p-3 md:grid-cols-[2fr_1.2fr_auto]'
            >
              <div className='space-y-1'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Parent IP ID
                </Label>
                <Input
                  placeholder='0x… parent IP Asset ID'
                  {...register(`${fieldName}.${index}.parentIpId` as const)}
                />
                {entryErrors?.parentIpId?.message && (
                  <ErrorText message={entryErrors.parentIpId.message} />
                )}
              </div>
              <div className='space-y-1'>
                <Label className='text-xs uppercase text-muted-foreground'>
                  Relationship type
                </Label>
                <select
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  {...register(`${fieldName}.${index}.type` as const)}
                >
                  {RELATIONSHIP_GROUPS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.values.map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {entryErrors?.type?.message && (
                  <ErrorText message={entryErrors.type.message} />
                )}
              </div>
              <div className='flex items-end justify-end'>
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

      {relationshipErrors?.message && (
        <ErrorText message={relationshipErrors.message as string} />
      )}
    </div>
  )
}

function ErrorText({ message }: { message: string }) {
  return <p className='text-xs text-destructive'>{message}</p>
}
