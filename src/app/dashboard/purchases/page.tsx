import { Buffer } from 'node:buffer'

import Link from 'next/link'

import {
  Download,
  ExternalLink,
  ShoppingBag,
  User,
  Sparkles
} from 'lucide-react'

import { loadBuyerProfile, loadBuyerPurchases } from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'
import { ipfsGatewayUrl } from '@/lib/ipfs'
import {
  ipAssetExplorerUrl,
  licenseTokenExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

export default async function PurchasesPage() {
  const [purchases, profile] = await Promise.all([
    loadBuyerPurchases(),
    loadBuyerProfile()
  ])

  const storyNetwork =
    (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
  const storyLicenseToken =
    (env.STORY_LICENSE_TOKEN_ADDRESS as `0x${string}` | undefined) ?? null
  const constellationNetwork =
    (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-emerald-500/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-primary/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400'
          >
            <ShoppingBag className='mr-2 h-3 w-3' />
            My Purchases
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              License Purchases
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              View all your acquired licenses, download C2PA bundles and
              verifiable credentials, and track settlement status across chains.
            </p>
          </div>
        </div>
      </section>

      <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
        <CardHeader className='space-y-4 pb-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
              <User className='h-6 w-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Buyer Profile
              </CardTitle>
              <CardDescription className='text-sm'>
                Your default license wallet and payment information for this
                session
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
        <CardContent className='grid gap-4 pt-6'>
          <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Default License Wallet
            </p>
            <p className='mt-2 break-all font-mono text-xs'>
              {profile.defaultMintTo ??
                'Not set — will be captured during checkout'}
            </p>
            <p className='mt-3 text-xs leading-relaxed text-muted-foreground'>
              This address will be prefilled for future orders. Update it during
              your next payment.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
        <CardHeader className='space-y-4 pb-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-background p-3 shadow-lg'>
              <Sparkles className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>My Licenses</CardTitle>
              <CardDescription className='text-sm'>
                Every invoice you claimed with this Internet Identity session
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {purchases.length === 0 && (
              <div className='rounded-2xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-background p-12 text-center'>
                <ShoppingBag className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
                <p className='text-base font-medium text-foreground'>
                  No purchases yet
                </p>
                <p className='mt-2 text-sm text-muted-foreground'>
                  When you pay an invoice, it will appear here with Story and
                  Constellation links
                </p>
              </div>
            )}
            {purchases.map(order => {
              const storyLink =
                storyLicenseToken && order.tokenOnChainId
                  ? licenseTokenExplorerUrl(
                      storyLicenseToken,
                      order.tokenOnChainId,
                      storyNetwork
                    )
                  : ipAssetExplorerUrl(order.ipId, storyNetwork)
              const constellationLink =
                order.constellationExplorerUrl &&
                order.constellationExplorerUrl.length > 0
                  ? order.constellationExplorerUrl
                  : order.constellationTx?.length
                    ? constellationExplorerUrl(
                        constellationNetwork,
                        order.constellationTx
                      )
                    : null
              const c2paLink = order.c2paArchiveUri
                ? ipfsGatewayUrl(order.c2paArchiveUri)
                : null
              const c2paFileName =
                order.c2paArchiveFileName ??
                `lexlink-license-${order.orderId}.zip`
              const vcHref = order.vcDocument
                ? `data:application/json;base64,${Buffer.from(
                    order.vcDocument,
                    'utf-8'
                  ).toString('base64')}`
                : null
              const receiptHref = `/verify/${order.orderId}`
              const statusBadge =
                order.status === 'finalized'
                  ? {
                      variant: 'default' as const,
                      className:
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }
                  : order.status === 'failed'
                    ? {
                        variant: 'outline' as const,
                        className: 'border-rose-400 text-rose-600'
                      }
                    : order.status === 'finalizing'
                      ? {
                          variant: 'outline' as const,
                          className: 'border-primary/60 text-primary'
                        }
                      : order.status === 'pending'
                        ? { variant: 'outline' as const, className: '' }
                        : { variant: 'outline' as const, className: '' }

              return (
                <div
                  key={order.orderId}
                  className='rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm transition-all hover:shadow-md'
                >
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='flex-1 space-y-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='text-base font-semibold'>
                          {order.ipTitle}
                        </h3>
                        <Badge
                          variant={statusBadge.variant}
                          className={statusBadge.className}
                        >
                          {order.status}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          ckBTC
                        </Badge>
                      </div>

                      <dl className='grid gap-2 text-sm'>
                        <div className='flex items-start gap-2'>
                          <dt className='min-w-[100px] text-muted-foreground'>
                            Order ID:
                          </dt>
                          <dd className='flex-1 break-all font-mono text-xs text-foreground'>
                            {order.orderId}
                          </dd>
                        </div>

                        {order.mintTo && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[100px] text-muted-foreground'>
                              License Wallet:
                            </dt>
                            <dd className='flex-1 break-all font-mono text-xs text-foreground'>
                              {order.mintTo}
                            </dd>
                          </div>
                        )}

                        {order.tokenOnChainId && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[100px] text-muted-foreground'>
                              License Token:
                            </dt>
                            <dd className='flex-1'>
                              <Link
                                href={storyLink}
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
                              >
                                Token {order.tokenOnChainId}
                                <ExternalLink className='h-3 w-3' />
                              </Link>
                            </dd>
                          </div>
                        )}

                        {constellationLink && order.constellationTx && (
                          <div className='flex items-start gap-2'>
                            <dt className='min-w-[100px] text-muted-foreground'>
                              Constellation:
                            </dt>
                            <dd className='flex-1'>
                              <Link
                                href={constellationLink}
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-1 break-all font-mono text-xs text-primary underline-offset-4 hover:underline'
                              >
                                {order.constellationTx}
                                <ExternalLink className='h-3 w-3' />
                              </Link>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Button asChild size='sm' variant='outline'>
                        <Link href={receiptHref}>View Receipt</Link>
                      </Button>

                      {order.status !== 'finalized' && (
                        <Button asChild size='sm' variant='outline'>
                          <Link href={`/pay/${order.orderId}`}>
                            Review Invoice
                          </Link>
                        </Button>
                      )}

                      {c2paLink && (
                        <Button asChild size='sm' variant='secondary'>
                          <a href={c2paLink} download={c2paFileName}>
                            <Download className='mr-2 h-4 w-4' />
                            C2PA
                          </a>
                        </Button>
                      )}

                      {vcHref && (
                        <Button asChild size='sm' variant='secondary'>
                          <a
                            href={vcHref}
                            download={`lexlink-license-vc-${order.orderId}.json`}
                          >
                            <Download className='mr-2 h-4 w-4' />
                            VC
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
