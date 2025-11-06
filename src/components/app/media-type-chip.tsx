'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const COMMON_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'video/mp4',
  'video/webm',
  'image/png',
  'image/jpeg',
  'application/pdf'
]

type MediaTypeChipProps = {
  value: string
  detectedValue?: string
  pending?: boolean
  onChange: (value: string) => void
  onReset: () => void
}

export function MediaTypeChip({
  value,
  detectedValue,
  pending,
  onChange,
  onReset
}: MediaTypeChipProps) {
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const badgeLabel = pending
    ? 'Detecting…'
    : value || detectedValue || 'application/octet-stream'

  const applyMime = (mime: string) => {
    if (!mime) return
    onChange(mime)
    setOpen(false)
    setCustomValue('')
  }

  return (
    <div className='space-y-2 text-xs'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline' className='font-mono'>
          {badgeLabel}
        </Badge>
        {detectedValue && value !== detectedValue ? (
          <button
            type='button'
            onClick={onReset}
            className='text-xs text-primary underline-offset-2 hover:underline'
          >
            Reset to detected
          </button>
        ) : null}
        <button
          type='button'
          onClick={() => setOpen(prev => !prev)}
          className='text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
        >
          {open ? 'Close' : 'Change'}
        </button>
      </div>
      {open ? (
        <div className='space-y-3 rounded-md border border-border/60 bg-card/60 p-3'>
          <div className='space-y-1'>
            <p className='font-semibold text-muted-foreground'>
              Common formats
            </p>
            <select
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              defaultValue=''
              onChange={event => {
                if (event.target.value) {
                  applyMime(event.target.value)
                }
              }}
            >
              <option value='' disabled>
                Select a MIME type
              </option>
              {COMMON_MIME_TYPES.map(mime => (
                <option key={mime} value={mime}>
                  {mime}
                </option>
              ))}
            </select>
          </div>
          <div className='space-y-1'>
            <p className='font-semibold text-muted-foreground'>
              Custom MIME type
            </p>
            <div className='flex gap-2'>
              <Input
                value={customValue}
                onChange={event => setCustomValue(event.target.value)}
                placeholder='application/vnd.custom+json'
              />
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  const trimmed = customValue.trim()
                  if (!trimmed) return
                  applyMime(trimmed)
                }}
              >
                Use
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
