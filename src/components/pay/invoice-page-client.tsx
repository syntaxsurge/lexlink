'use client'

import Link from 'next/link'

import { ShieldAlert } from 'lucide-react'

import { CkbtcPayPanel } from '@/app/pay/[orderId]/_components/ckbtc-pay-panel'
import { FinalizationTimeline } from '@/app/pay/[orderId]/_components/finalization-timeline'
import {
  InvoiceStatusProvider,
  type InvoiceSnapshot
} from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { InvoiceSummary } from '@/app/pay/[orderId]/_components/invoice-summary'
import { MintTargetCard } from '@/app/pay/[orderId]/_components/mint-target-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
      <div className='mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10'>
        <Card className='border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
          <CardHeader className='space-y-4 text-center'>
            <Badge
              variant='outline'
              className='mx-auto w-fit uppercase tracking-widest text-xs text-muted-foreground'
            >
              LexLink invoice
            </Badge>
            <div className='space-y-2'>
              <CardTitle className='text-3xl font-semibold tracking-tight text-foreground'>
                Pay license order
              </CardTitle>
              <CardDescription className='text-base text-muted-foreground'>
                Complete ckBTC settlement for{' '}
                <span className='font-semibold text-foreground'>
                  {initialInvoice.ipTitle}
                </span>
                . Save your license wallet, send ckBTC, and follow automated
                verification in one place.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground'>
            <div className='rounded-full border border-border/60 bg-background/80 px-4 py-2 font-mono text-[11px] text-foreground'>
              Order ID {initialInvoice.orderId}
            </div>
            <div className='rounded-full border border-border/60 bg-background/80 px-4 py-2 font-semibold text-foreground'>
              {ckbtcNetwork === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'} escrow
            </div>
          </CardContent>
          <CardFooter className='flex flex-wrap items-center justify-center gap-3'>
            <Button variant='outline' size='sm' asChild className='gap-2 rounded-full px-4'>
              <Link href={`/report?ipId=${initialInvoice.ipId}`}>
                <ShieldAlert className='h-4 w-4' />
                Report IP misuse
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <InvoiceSummary networkLabel={ckbtcNetwork} />

        {showCkbtcPay && escrowPrincipal ? (
          <CkbtcPayPanel
            escrowPrincipal={escrowPrincipal}
            network={ckbtcNetwork}
            defaultMintTo={defaultMintTo}
          />
        ) : (
          <Card className='border-amber-500/40 bg-amber-500/10 text-amber-600'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>
                ckBTC payment unavailable
              </CardTitle>
              <CardDescription className='text-sm text-amber-600/90'>
                Ledger configuration is missing for this environment. Contact an
                operator to enable direct ckBTC settlement.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!showCkbtcPay && (
          <MintTargetCard
            orderId={initialInvoice.orderId}
            defaultMintTo={defaultMintTo}
          />
        )}

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
    </InvoiceStatusProvider>
  )
}
