'use client'

import Link from 'next/link'

import { BtcManualInstructions } from '@/app/pay/[orderId]/_components/btc-manual-instructions'
import { CkbtcPayPanel } from '@/app/pay/[orderId]/_components/ckbtc-pay-panel'
import { FinalizationTimeline } from '@/app/pay/[orderId]/_components/finalization-timeline'
import {
  InvoiceStatusProvider,
  type InvoiceSnapshot
} from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { InvoiceSummary } from '@/app/pay/[orderId]/_components/invoice-summary'
import { MintTargetCard } from '@/app/pay/[orderId]/_components/mint-target-card'
import { Button } from '@/components/ui/button'
import type { ConstellationNetworkId } from '@/lib/constellation-links'
import type { StoryNetwork } from '@/lib/story-links'

type InvoicePageClientProps = {
  initialInvoice: InvoiceSnapshot
  isCkbtc: boolean
  showCkbtcPay: boolean
  escrowPrincipal?: string | null
  ckbtcNetwork: 'ckbtc-mainnet' | 'ckbtc-testnet'
  fallbackNetwork: string
  storyNetwork: StoryNetwork
  storyLicenseAddress: `0x${string}`
  storyLicenseTokenAddress: `0x${string}`
  storyChainId: number
  constellationNetwork: ConstellationNetworkId
  constellationEnabled: boolean
  defaultMintTo?: string | null
}

export function InvoicePageClient({
  initialInvoice,
  isCkbtc,
  showCkbtcPay,
  escrowPrincipal,
  ckbtcNetwork,
  fallbackNetwork,
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
      <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10'>
        <header className='space-y-2 text-center'>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            LexLink Invoice
          </p>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Order {initialInvoice.orderId.slice(0, 8)}…
          </h1>
          <p className='text-muted-foreground'>
            {isCkbtc
              ? 'Pay with ckTESTBTC using your Internet Identity—save your license wallet and submit the ledger transfer in one step.'
              : 'Send Bitcoin to the escrow address to finalize the license automatically.'}
          </p>
        </header>

        <InvoiceSummary fallbackNetwork={fallbackNetwork} />

        <div className='flex justify-center'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/report?ipId=${initialInvoice.ipId}`}>
              Report IP misuse
            </Link>
          </Button>
        </div>

        {isCkbtc ? (
          <>
            {showCkbtcPay && escrowPrincipal ? (
              <CkbtcPayPanel
                escrowPrincipal={escrowPrincipal}
                network={ckbtcNetwork}
                defaultMintTo={defaultMintTo}
              />
            ) : (
              <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-600'>
                ckBTC payment is not available because the ledger configuration
                is incomplete for this deployment. Contact the operator to
                enable direct ckBTC settlement.
              </div>
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
          </>
        ) : (
          <>
            <MintTargetCard
              orderId={initialInvoice.orderId}
              defaultMintTo={defaultMintTo}
            />
            <BtcManualInstructions />
          </>
        )}
        {!isCkbtc && (
          <FinalizationTimeline
            ckbtcNetwork={ckbtcNetwork}
            storyNetwork={storyNetwork}
            storyLicenseAddress={storyLicenseAddress}
            storyLicenseTokenAddress={storyLicenseTokenAddress}
            storyChainId={storyChainId}
            constellationNetwork={constellationNetwork}
            constellationEnabled={constellationEnabled}
          />
        )}
      </div>
    </InvoiceStatusProvider>
  )
}
