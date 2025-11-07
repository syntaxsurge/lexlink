'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  createLicenseOrder,
  type IpRecord
} from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TextDialog } from '@/components/ui/text-dialog'
import { useRouter } from 'next/navigation'

type LicenseOrderPanelProps = {
  ips: IpRecord[]
  defaultIpId?: string
}

type CreateOrderResult = Awaited<ReturnType<typeof createLicenseOrder>>

function formatBtc(sats?: number) {
  if (!sats) return 'N/A'
  return (sats / 100_000_000).toFixed(6)
}

export function LicenseOrderPanel({
  ips,
  defaultIpId
}: LicenseOrderPanelProps) {
  const router = useRouter()
  const [selectedIpId, setSelectedIpId] = useState<string>(() => {
    if (defaultIpId && ips.some(ip => ip.ipId === defaultIpId)) {
      return defaultIpId
    }
    return ips[0]?.ipId ?? ''
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<
    (CreateOrderResult & { ip: IpRecord }) | null
  >(null)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (defaultIpId && ips.some(ip => ip.ipId === defaultIpId)) {
      setSelectedIpId(defaultIpId)
      return
    }
    if (!selectedIpId || !ips.some(ip => ip.ipId === selectedIpId)) {
      setSelectedIpId(ips[0]?.ipId ?? '')
    }
  }, [defaultIpId, ips, selectedIpId])

  const selectedIp = useMemo(
    () => ips.find(ip => ip.ipId === selectedIpId),
    [ips, selectedIpId]
  )

  const hasLicensableAssets = ips.length > 0

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedIp) {
      setError('Select an IP asset to generate an invoice.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const response = await createLicenseOrder({
          ipId: selectedIp.ipId,
          licenseTermsId: selectedIp.licenseTermsId
        })
        setCreatedOrder({ ...response, ip: selectedIp })
        toast.success('ckBTC invoice created')
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create invoice'
        setError(message)
        toast.error(message)
      }
    })
  }

  const shareLink =
    createdOrder &&
    (origin
      ? `${origin}/pay/${createdOrder.orderId}`
      : `/pay/${createdOrder.orderId}`)

  const handleCopyLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast.success('Share link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Unable to copy link')
    }
  }

  return (
    <Card className='border-border/70 bg-gradient-to-br from-card/80 via-background to-card shadow-lg'>
      <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <CardTitle className='text-2xl font-semibold'>
            Generate ckBTC Invoice
          </CardTitle>
          <CardDescription>
            Mint a deterministic escrow target and share the buyer-facing link
            instantly.
          </CardDescription>
        </div>
        {selectedIp && (
          <Badge variant='outline' className='text-xs'>
            {selectedIp.title}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {hasLicensableAssets ? (
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='ip-select'>IP asset</Label>
              <Select
                value={selectedIpId || undefined}
                onValueChange={value => setSelectedIpId(value)}
              >
                <SelectTrigger id='ip-select'>
                  <SelectValue placeholder='Select an IP asset' />
                </SelectTrigger>
                <SelectContent>
                  {ips.map(ip => (
                    <SelectItem key={ip.ipId} value={ip.ipId}>
                      {ip.title} - {formatBtc(ip.priceSats)} ckBTC
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Update pricing or license terms from the IP registry before
                issuing an invoice.
              </p>
            </div>

            {selectedIp && (
              <div className='rounded-2xl border border-border/60 bg-muted/10 p-4'>
                <div className='flex flex-wrap items-center gap-6'>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Price
                    </p>
                    <p className='text-lg font-semibold'>
                      {formatBtc(selectedIp.priceSats)} ckBTC
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Royalty
                    </p>
                    <p className='text-lg font-semibold'>
                      {(selectedIp.royaltyBps / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Commercial Use
                    </p>
                    <p className='text-lg font-semibold'>
                      {selectedIp.commercialUse ? 'Allowed' : 'Restricted'}
                    </p>
                  </div>
                </div>
                {selectedIp.tags && selectedIp.tags.length > 0 && (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {selectedIp.tags.slice(0, 4).map(tag => (
                      <Badge key={tag} variant='outline' className='bg-background'>
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant='destructive'>
                <AlertTitle>Unable to create invoice</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='flex flex-wrap items-center gap-3'>
              <Button
                type='submit'
                disabled={isPending || !selectedIp}
                className='min-w-[220px]'
              >
                {isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Generate ckBTC invoice
              </Button>
              <p className='text-xs text-muted-foreground'>
                Invoice URLs remain valid until ckBTC lands in escrow.
              </p>
            </div>
          </form>
        ) : (
          <div className='rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center'>
            <p className='text-sm text-muted-foreground'>
              Register or generate an IP asset before issuing ckBTC invoices.
            </p>
            <div className='mt-4 flex flex-wrap items-center justify-center gap-3'>
              <Button asChild variant='outline'>
                <Link href='/dashboard/ip'>Open IP registry</Link>
              </Button>
              <Button asChild variant='secondary'>
                <Link href='/dashboard/ai'>Open AI Studio</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {createdOrder && (
        <CardFooter className='flex flex-col gap-4 border-t border-border/60 bg-primary/5'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm font-semibold text-primary'>
                Invoice ready
              </p>
              <p className='text-xs text-muted-foreground'>
                Share the link or open the public pay page to collect ckBTC.
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Button asChild size='sm'>
                <Link
                  href={`/pay/${createdOrder.orderId}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Open invoice
                </Link>
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={handleCopyLink}
                disabled={!shareLink}
              >
                {copied ? 'Link copied' : 'Copy share link'}
              </Button>
            </div>
          </div>
          <div className='rounded-xl border border-primary/40 bg-background/80 p-4 text-xs'>
            <dl className='grid gap-2 md:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground'>Order ID</dt>
                <dd>
                  <TextDialog
                    title='Order ID'
                    content={createdOrder.orderId}
                    truncateLength={16}
                    triggerClassName='font-mono text-xs text-primary hover:underline'
                  />
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Escrow account</dt>
                <dd className='break-all font-mono'>
                  {createdOrder.btcAddress}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>ckBTC subaccount</dt>
                <dd className='font-mono'>
                  {createdOrder.ckbtcSubaccount ?? 'N/A'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Share link</dt>
                <dd className='break-all font-mono'>
                  {shareLink}
                </dd>
              </div>
            </dl>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
