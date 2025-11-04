'use client'

import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

const badgeVariants = {
  default:
    'inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground',
  outline:
    'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium'
}

type Variant = keyof typeof badgeVariants

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant
  asChild?: boolean
}

export function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'div'
  return <Comp className={cn(badgeVariants[variant], className)} {...props} />
}
