'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme='dark'
      position='top-center'
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-border bg-background text-foreground shadow-lg',
          description: 'text-sm text-muted-foreground'
        }
      }}
    />
  )
}
