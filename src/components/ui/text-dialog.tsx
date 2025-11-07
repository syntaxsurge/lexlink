'use client'

import { useState } from 'react'

import { Copy, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type TextDialogProps = {
  title: string
  description?: string
  content: string
  truncateLength?: number
  triggerClassName?: string
  externalLinkHref?: string
  externalLinkLabel?: string
}

export function TextDialog({
  title,
  description,
  content,
  truncateLength = 20,
  triggerClassName,
  externalLinkHref,
  externalLinkLabel = 'Open link'
}: TextDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy text')
      console.error('Copy failed:', error)
    }
  }

  const truncated =
    content.length > truncateLength
      ? `${content.slice(0, truncateLength)}…`
      : content

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={
            triggerClassName ?? 'h-auto p-0 font-mono text-xs hover:underline'
          }
        >
          {truncated}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='space-y-3'>
          <ScrollArea className='h-[400px] w-full rounded-lg border border-border/60'>
            <div className='p-4'>
              <p className='break-all font-mono text-xs leading-relaxed'>
                {content}
              </p>
            </div>
          </ScrollArea>
          <Button
            onClick={handleCopy}
            variant='outline'
            size='sm'
            className='w-full'
          >
            <Copy className='mr-2 h-4 w-4' />
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
          {externalLinkHref ? (
            <Button asChild size='sm' className='w-full'>
              <a href={externalLinkHref} target='_blank' rel='noreferrer'>
                {externalLinkLabel}
              </a>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ViewDetailsDialogProps = {
  title: string
  description?: string
  children: React.ReactNode
  triggerLabel?: string
  triggerIcon?: React.ReactNode
  triggerClassName?: string
}

export function ViewDetailsDialog({
  title,
  description,
  children,
  triggerLabel = 'View Details',
  triggerIcon,
  triggerClassName
}: ViewDetailsDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className={triggerClassName}>
          {triggerIcon ?? <Eye className='mr-2 h-4 w-4' />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[80vh] max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className='max-h-[calc(80vh-120px)] pr-4'>
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
