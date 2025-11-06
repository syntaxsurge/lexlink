'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { CheckCircle2, Circle, Clock3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  useInvoiceStatus
} from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { formatTokenAmount } from '@/lib/ic/ckbtc/utils'
import {
  constellationExplorerUrl,
  constellationTransactionApiUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import {
  licenseTokenExplorerUrl,
  storyScanBase,
  type StoryNetwork
} from '@/lib/story-links'

type FinalizationTimelineProps = {
  escrowPrincipal?: string | null
  ckbtcNetwork: 'ckbtc-mainnet' | 'ckbtc-testnet'
  storyNetwork: StoryNetwork
  storyLicenseAddress: `0x${string}`
  storyChainId: number
  constellationNetwork: ConstellationNetworkId
  constellationEnabled: boolean
}

type StepStatus = 'complete' | 'current' | 'upcoming'

function formatDate(ms?: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString()
}

function formatBytes(size?: number | null) {
  if (!size || size <= 0) {
    return null
  }
  if (size < 1024) {
    return `${size} B`
  }
  const units = ['KB', 'MB', 'GB']
  let value = size / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}
function resolveStatusIcon(status: StepStatus) {
  if (status === 'complete') {
    return (
      <CheckCircle2 className='h-5 w-5 text-emerald-500' aria-hidden='true' />
    )
  }
  if (status === 'current') {
    return <Clock3 className='h-5 w-5 text-primary' aria-hidden='true' />
  }
  return <Circle className='h-5 w-5 text-muted-foreground' aria-hidden='true' />
}

export function FinalizationTimeline({
  escrowPrincipal,
  ckbtcNetwork,
  storyNetwork,
  storyLicenseAddress,
  storyChainId,
  constellationNetwork,
  constellationEnabled
}: FinalizationTimelineProps) {
  const { invoice } = useInvoiceStatus()

  const isCkbtc = invoice.paymentMode !== 'btc'
  const ckbtcSymbol = ckbtcNetwork === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'
  const paymentComplete = isCkbtc
    ? typeof invoice.ckbtcMintedSats === 'number' && invoice.ckbtcMintedSats > 0
    : Boolean(invoice.btcTxId && invoice.btcTxId.length > 0)
  const licenseMinted =
    typeof invoice.tokenOnChainId === 'string' &&
    invoice.tokenOnChainId.trim().length > 0
  const evidenceAnchored = constellationEnabled
    ? Boolean(invoice.constellationTx && invoice.constellationTx.length > 0)
    : true
  const auditLogged =
    typeof invoice.finalizedAt === 'number' && invoice.finalizedAt > 0

  const paymentDetails = useMemo(() => {
    if (isCkbtc) {
      const minted =
        typeof invoice.ckbtcMintedSats === 'number'
          ? formatTokenAmount(BigInt(invoice.ckbtcMintedSats), 8)
          : null
      return (
        <div className='space-y-1 text-xs text-muted-foreground'>
          {minted ? (
            <p>
              Escrow credited with{' '}
              <span className='font-semibold text-foreground'>
                {minted} {ckbtcSymbol}
              </span>{' '}
              ({invoice.ckbtcMintedSats?.toLocaleString() ?? 0} sats).
            </p>
          ) : (
            <p>
              Waiting for the ckBTC ledger to detect the transfer into this
              order&apos;s escrow subaccount.
            </p>
          )}
          {typeof invoice.ckbtcBlockIndex === 'number' &&
            invoice.ckbtcBlockIndex > 0 && (
              <p>
                Ledger block index{' '}
                <span className='font-mono text-foreground'>
                  {invoice.ckbtcBlockIndex}
                </span>
                .
              </p>
            )}
          <p>
            ICRC-1 account{' '}
            <span className='break-all font-mono text-foreground'>
              {invoice.btcAddress}
            </span>
            .
          </p>
          {invoice.ckbtcSubaccount && (
            <p>
              Subaccount (hex){' '}
              <span className='break-all font-mono text-foreground'>
                {invoice.ckbtcSubaccount}
              </span>
              .
            </p>
          )}
          {escrowPrincipal && (
            <p>
              Ledger owner{' '}
              <span className='break-all font-mono text-foreground'>
                {escrowPrincipal}
              </span>
              .
            </p>
          )}
          {invoice.fundedAt && (
            <p>
              Detected {formatDate(invoice.fundedAt)}.
            </p>
          )}
        </div>
      )
    }

    return (
      <div className='space-y-1 text-xs text-muted-foreground'>
        {invoice.btcTxId ? (
          <>
            <p>
              Bitcoin transfer observed for address{' '}
              <span className='break-all font-mono text-foreground'>
                {invoice.btcAddress}
              </span>
              .
            </p>
            <p>
              Transaction hash{' '}
              <span className='break-all font-mono text-foreground'>
                {invoice.btcTxId}
              </span>
              .
            </p>
          </>
        ) : (
          <p>
            Waiting for Bitcoin confirmations on{' '}
            <span className='break-all font-mono text-foreground'>
              {invoice.btcAddress}
            </span>
            .
          </p>
        )}
        {invoice.fundedAt && (
          <p>
            Detected {formatDate(invoice.fundedAt)}.
          </p>
        )}
      </div>
    )
  }, [
    ckbtcSymbol,
    escrowPrincipal,
    invoice.btcAddress,
    invoice.btcTxId,
    invoice.ckbtcBlockIndex,
    invoice.ckbtcMintedSats,
    invoice.ckbtcSubaccount,
    invoice.fundedAt,
    isCkbtc
  ])

  const storyLinks = useMemo(() => {
    if (!licenseMinted) {
      return null
    }
    const tokenId = invoice.tokenOnChainId?.trim() ?? ''
    const tokenUrl = licenseTokenExplorerUrl(
      storyLicenseAddress,
      tokenId,
      storyNetwork
    )
    const contractUrl = `${storyScanBase(storyNetwork)}/address/${storyLicenseAddress}`

    return { tokenUrl, contractUrl, tokenId }
  }, [invoice.tokenOnChainId, licenseMinted, storyLicenseAddress, storyNetwork])

  const constellationLinks = useMemo(() => {
    if (!constellationEnabled || !invoice.constellationTx) {
      return null
    }
    const txHash = invoice.constellationTx
    return {
      explorerUrl: constellationExplorerUrl(constellationNetwork, txHash),
      apiUrl: constellationTransactionApiUrl(constellationNetwork, txHash),
      txHash
    }
  }, [
    constellationEnabled,
    constellationNetwork,
    invoice.constellationTx
  ])

  const steps = useMemo(() => {
    const base = [
      {
        key: 'payment',
        title: 'Payment credited',
        complete: paymentComplete,
        content: paymentDetails
      },
      {
        key: 'license',
        title: 'License token minted',
        complete: licenseMinted,
        content: (
          <div className='space-y-1 text-xs text-muted-foreground'>
            {licenseMinted ? (
              <>
                <p>
                  Story Protocol license token{' '}
                  <span className='font-mono text-foreground'>
                    {storyLinks?.tokenId}
                  </span>{' '}
                  minted to{' '}
                  <span className='break-all font-mono text-foreground'>
                    {invoice.buyer}
                  </span>
                  .
                </p>
                <p>
                  Contract{' '}
                  <span className='break-all font-mono text-foreground'>
                    {storyLicenseAddress}
                  </span>{' '}
                  on chain {storyChainId}.
                </p>
                {invoice.licenseTermsId && (
                  <p>
                    Terms ID{' '}
                    <span className='font-mono text-foreground'>
                      {invoice.licenseTermsId}
                    </span>
                    .
                  </p>
                )}
                {storyLinks && (
                  <p className='space-x-2'>
                    <Link
                      href={storyLinks.tokenUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      View token on StoryScan
                    </Link>
                    <Link
                      href={storyLinks.contractUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      View contract
                    </Link>
                  </p>
                )}
              </>
            ) : (
              <p>
                Awaiting license token mint on Story Protocol. This runs
                immediately after the payment clears.
              </p>
            )}
          </div>
        )
      },
      {
        key: 'constellation',
        title: 'Constellation evidence anchored',
        complete: evidenceAnchored,
        content: (
          <div className='space-y-1 text-xs text-muted-foreground'>
            {constellationEnabled ? (
              constellationLinks ? (
                <>
                  <p>
                    Evidence hash anchored on Constellation{' '}
                    <span className='uppercase text-foreground'>
                      {constellationNetwork}
                    </span>
                    .
                  </p>
                  <p>
                    Transaction{' '}
                    <span className='break-all font-mono text-foreground'>
                      {constellationLinks.txHash}
                    </span>
                    .
                  </p>
                  <p className='space-x-2'>
                    <Link
                      href={constellationLinks.explorerUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      Open explorer
                    </Link>
                    <Link
                      href={constellationLinks.apiUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      View JSON payload
                    </Link>
                  </p>
                </>
              ) : (
                <p>
                  Finalization will publish the proof bundle to Constellation{' '}
                  <span className='uppercase text-foreground'>
                    {constellationNetwork}
                  </span>
                  .
                </p>
              )
            ) : (
              <p>Constellation anchoring is disabled for this deployment.</p>
            )}
          </div>
        )
      },
      {
        key: 'audit',
        title: 'Audit log recorded',
        complete: auditLogged,
        content: (
          <div className='space-y-1 text-xs text-muted-foreground'>
            {auditLogged ? (
              <>
                <p>
                  Convex audit ledger updated{' '}
                  <span className='font-semibold text-foreground'>
                    {formatDate(invoice.finalizedAt)}
                  </span>
                  .
                </p>
                {typeof invoice.complianceScore === 'number' && (
                  <p>
                    Compliance score:{' '}
                    <span className='font-semibold text-foreground'>
                      {invoice.complianceScore}
                    </span>
                    .
                  </p>
                )}
                {invoice.attestationHash && (
                  <p>
                    Attestation hash{' '}
                    <span className='break-all font-mono text-foreground'>
                      {invoice.attestationHash}
                    </span>
                    .
                  </p>
                )}
                {invoice.vcHash && (
                  <p>
                    Verifiable credential hash{' '}
                    <span className='break-all font-mono text-foreground'>
                      {invoice.vcHash}
                    </span>
                    .
                  </p>
                )}
                {invoice.c2paArchiveUrl && (
                  <p className='space-x-1'>
                    <Link
                      href={invoice.c2paArchiveUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      {invoice.c2paArchiveFileName ?? 'Download C2PA bundle'}
                    </Link>
                    {formatBytes(invoice.c2paArchiveSize) && (
                      <span className='text-muted-foreground'>
                        ({formatBytes(invoice.c2paArchiveSize)})
                      </span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p>
                Once finalization completes, the compliance ledger will capture
                attestation, VC, and payment hashes.
              </p>
            )}
          </div>
        )
      }
    ]

    let hasCurrent = false
    return base.map(step => {
      if (step.complete) {
        return { ...step, status: 'complete' as StepStatus }
      }
      if (!hasCurrent) {
        hasCurrent = true
        return { ...step, status: 'current' as StepStatus }
      }
      return { ...step, status: 'upcoming' as StepStatus }
    })
  }, [
    auditLogged,
    constellationEnabled,
    constellationLinks,
    constellationNetwork,
    evidenceAnchored,
    invoice.attestationHash,
    invoice.buyer,
    invoice.complianceScore,
    invoice.finalizedAt,
    invoice.c2paArchiveFileName,
    invoice.c2paArchiveSize,
    invoice.c2paArchiveUrl,
    invoice.licenseTermsId,
    licenseMinted,
    paymentComplete,
    paymentDetails,
    storyChainId,
    storyLicenseAddress,
    storyLinks
  ])

  return (
    <section className='space-y-4 rounded-xl border border-border/70 bg-card/60 p-6'>
      <header>
        <h2 className='text-lg font-semibold text-foreground'>
          Verification timeline
        </h2>
        <p className='text-sm text-muted-foreground'>
          Track each automated action after payment lands: ckBTC settlement,
          Story license minting, Constellation anchoring, and the compliance
          ledger update.
        </p>
      </header>
      <ol className='space-y-6'>
        {steps.map(step => (
          <li key={step.key} className='flex gap-3'>
            <div className='flex h-5 w-5 items-center justify-center'>
              {resolveStatusIcon(step.status)}
            </div>
            <div className='flex-1 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='font-medium text-foreground'>{step.title}</p>
                <Badge
                  variant={step.status === 'complete' ? 'default' : 'outline'}
                  className={
                    step.status === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : step.status === 'current'
                        ? 'border-primary/60 text-primary'
                        : 'text-muted-foreground'
                  }
                >
                  {step.status === 'complete'
                    ? 'Complete'
                    : step.status === 'current'
                      ? 'In progress'
                      : 'Waiting'}
                </Badge>
              </div>
              {step.content}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
