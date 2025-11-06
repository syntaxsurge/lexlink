'use client'

import { useEffect } from 'react'

import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='container-edge'>
      <div className='flex min-h-[60vh] items-center justify-center py-12'>
        <Card className='max-w-2xl border-destructive/50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-2xl'>
              <AlertCircle className='h-6 w-6 text-destructive' />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertTitle>Error details</AlertTitle>
              <AlertDescription className='mt-2 font-mono text-sm'>
                {error.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            <div className='flex gap-3'>
              <Button onClick={() => reset()} variant='default'>
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant='outline'
              >
                Go home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
