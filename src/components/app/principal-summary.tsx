'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

type PrincipalSummaryProps = {
  principal: string
}

export function PrincipalSummary({ principal }: PrincipalSummaryProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principal)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy principal id', error)
    }
  }

  return (
    <Card className='border-border/60 bg-card/60'>
      <CardHeader className='flex flex-row items-center justify-between gap-4'>
        <div>
          <CardTitle className='text-base font-semibold'>
            Principal ID
          </CardTitle>
          <p className='text-xs text-muted-foreground'>
            The active Internet Identity principal for this console session.
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <code className='block break-all rounded bg-muted/40 p-3 text-xs font-mono'>
          {principal}
        </code>
      </CardContent>
    </Card>
  )
}
