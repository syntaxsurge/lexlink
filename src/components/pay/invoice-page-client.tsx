'use client'

import Link from 'next/link'

import { ShieldAlert } from 'lucide-react'

import { CkbtcPayPanel } from '@/components/pay/ckbtc-pay-panel'
import { FinalizationTimeline } from '@/components/pay/finalization-timeline'
import {
  InvoiceStatusProvider,
  type InvoiceSnapshot
} from '@/components/pay/invoice-status-provider'
import { InvoiceSummary } from '@/components/pay/invoice-summary'
import { LicenseWalletCard } from '@/components/pay/license-wallet-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ConstellationNetworkId } from '@/lib/constellation-links'
import type { StoryNetwork } from '@/lib/story-links'

type InvoicePageClientProps = {
  initialInvoice: InvoiceSnapshot
  showCkbtcPay: boolean
  escrowPrincipal?: string | null
  ckbtcNetwork: 'ckbtc-mainnet' | 'ckbtc-testnet'
  storyNetwork: StoryNetwork
  storyLicenseAddress: `0x${string}`
  storyLicenseTokenAddress: `0x${string}`
  storyChainId: number
  constellationNetwork: ConstellationNetworkId
  constellationEnabled: boolean
  defaultMintTo?: string | null
}

export default function InvoicePageClient({
  initialInvoice,
  showCkbtcPay,
  escrowPrincipal,
  ckbtcNetwork,
  storyNetwork,
  storyLicenseAddress,
  storyLicenseTokenAddress,
  storyChainId,
  constellationNetwork,
  constellationEnabled,
  defaultMintTo
}: InvoicePageClientProps) {
  return (
    <InvoiceStatusProvider
      orderId={initialInvoice.orderId}
      initialInvoice={initialInvoice}
    >
      <div className='container-edge space-y-12 py-12'>
        {/* Hero Section */}
        <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background p-12 text-center shadow-2xl'>
          <div className='absolute left-0 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl' />
          <div className='absolute bottom-4 right-6 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl' />
          <div className='relative z-10 space-y-6'>
            <Badge
              variant='outline'
              className='mx-auto w-fit border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary'
            >
              LexLink Invoice
            </Badge>
            <div className='space-y-3'>
              <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
                Pay License Order
              </h1>
              <p className='mx-auto max-w-2xl text-base text-muted-foreground md:text-lg'>
                Complete ckBTC settlement for{' '}
                <span className='font-semibold text-foreground'>
                  {initialInvoice.ipTitle}
                </span>
                . Save your license wallet, send ckBTC, and follow automated
                verification in one place.
              </p>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
              <div className='rounded-full border border-border/60 bg-background/80 px-5 py-2.5 font-mono text-xs text-foreground shadow-sm backdrop-blur-sm'>
                Order ID: {initialInvoice.orderId}
              </div>
              <div className='rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-sm dark:text-emerald-400'>
                {ckbtcNetwork === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'}{' '}
                Escrow
              </div>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-3 pt-4'>
              <Button
                variant='outline'
                size='sm'
                asChild
                className='gap-2 rounded-full px-5 transition-all hover:border-primary/40 hover:bg-primary/5'
              >
                <Link href={`/report?ipId=${initialInvoice.ipId}`}>
                  <ShieldAlert className='h-4 w-4' />
                  Report IP Misuse
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className='mx-auto max-w-6xl space-y-8'>
          <InvoiceSummary networkLabel={ckbtcNetwork} />

          <div className='grid gap-8 lg:grid-cols-[1fr,400px]'>
            <div className='space-y-8'>
              {showCkbtcPay && escrowPrincipal ? (
                <CkbtcPayPanel
                  escrowPrincipal={escrowPrincipal}
                  network={ckbtcNetwork}
                  defaultMintTo={defaultMintTo}
                />
              ) : (
                <Card className='border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5 shadow-lg'>
                  <CardHeader className='space-y-2'>
                    <CardTitle className='text-lg font-semibold text-amber-700 dark:text-amber-500'>
                      ckBTC Payment Unavailable
                    </CardTitle>
                    <CardDescription className='text-sm text-amber-600/90 dark:text-amber-400/80'>
                      Ledger configuration is missing for this environment.
                      Contact an operator to enable direct ckBTC settlement.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {!showCkbtcPay && (
                <LicenseWalletCard
                  orderId={initialInvoice.orderId}
                  defaultMintTo={defaultMintTo}
                />
              )}
            </div>

            {/* Side Information Card */}
            <Card className='h-fit rounded-2xl border-border/60 bg-gradient-to-b from-card to-background shadow-lg'>
              <CardHeader className='space-y-2'>
                <CardTitle className='text-xl font-semibold'>
                  Payment Guide
                </CardTitle>
                <CardDescription>
                  Follow these steps to complete your purchase
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex gap-3'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                      1
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        Authenticate
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Connect your Internet Identity to bind this order to
                        your principal
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                      2
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        Save Wallet
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Enter your EVM wallet address to receive the license
                        token
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                      3
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        Send Payment
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Transfer ckBTC to complete the order and mint your
                        license
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                      4
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        Track Progress
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Monitor automated verification in the timeline below
                      </p>
                    </div>
                  </div>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground'>
                  <p className='font-medium text-foreground'>Need help?</p>
                  <p className='mt-1'>
                    Contact support or visit our documentation for detailed
                    guidance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <FinalizationTimeline
            ckbtcNetwork={ckbtcNetwork}
            storyNetwork={storyNetwork}
            storyLicenseAddress={storyLicenseAddress}
            storyLicenseTokenAddress={storyLicenseTokenAddress}
            storyChainId={storyChainId}
            constellationNetwork={constellationNetwork}
            constellationEnabled={constellationEnabled}
          />
        </div>
      </div>
    </InvoiceStatusProvider>
  )
}
