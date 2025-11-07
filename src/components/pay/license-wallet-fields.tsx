'use client'

import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LicenseWalletFieldsProps = {
  label?: string
  description?: string
  value: string
  onChange: (value: string) => void
  rememberPreference: boolean
  onRememberPreferenceChange: (value: boolean) => void
  defaultMintTo?: string | null
  savedMintTo?: string | null
  disabled?: boolean
  helperText?: string
  error?: string | null
  showDefaultShortcut?: boolean
  showSavedBadge?: boolean
}

export function LicenseWalletFields({
  label = 'License receiver (EVM wallet)',
  description = 'We mint the Story license token to this address once payment finalizes.',
  value,
  onChange,
  rememberPreference,
  onRememberPreferenceChange,
  defaultMintTo,
  savedMintTo,
  disabled,
  helperText,
  error,
  showDefaultShortcut = true,
  showSavedBadge = true
}: LicenseWalletFieldsProps) {
  const inputId = useId()
  const normalizedDefault = defaultMintTo?.trim()
  const normalizedSaved = savedMintTo?.trim()

  return (
    <div className='space-y-2'>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder='0x…'
        spellCheck={false}
        disabled={disabled}
      />
      <p className='text-xs text-muted-foreground'>{description}</p>
      {showDefaultShortcut && normalizedDefault && !normalizedSaved && (
        <button
          type='button'
          className='text-xs text-primary underline-offset-4 hover:underline disabled:text-muted-foreground'
          onClick={() => onChange(normalizedDefault)}
          disabled={disabled}
        >
          Use saved wallet {shortAddress(normalizedDefault)}
        </button>
      )}
      {error ? (
        <p className='text-xs text-destructive'>{error}</p>
      ) : (
        helperText && (
          <p className='text-xs text-muted-foreground'>{helperText}</p>
        )
      )}
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <input
          id={`${inputId}-remember`}
          type='checkbox'
          className='h-4 w-4 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          checked={rememberPreference}
          onChange={event => onRememberPreferenceChange(event.target.checked)}
          disabled={disabled}
        />
        <Label htmlFor={`${inputId}-remember`} className='cursor-pointer'>
          Remember this wallet for future purchases
        </Label>
      </div>
      {showSavedBadge && normalizedSaved && (
        <p className='text-xs text-muted-foreground'>
          Saved wallet: {shortAddress(normalizedSaved)}
        </p>
      )}
    </div>
  )
}

export function isValidMintAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/i.test(value.trim())
}

export function shortAddress(value?: string, length = 10) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= length) return trimmed
  return `${trimmed.slice(0, length)}…`
}
