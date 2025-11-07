'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { CheckCircle2, Circle, Clock3, Download, ExternalLink, XCircle } from 'lucide-react'

import { useInvoiceStatus } from '@/app/pay/[orderId]/_components/invoice-status-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  constellationExplorerUrl,
  constellationTransactionApiUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { formatTokenAmount } from '@/lib/ic/ckbtc/utils'
import {
  licenseTokenExplorerUrl,
  storyScanBase,
  type StoryNetwork
} from '@/lib/story-links'

type FinalizationTimelineProps = {
  ckbtcNetwork: 'ckbtc-mainnet' | 'ckbtc-testnet'
  storyNetwork: StoryNetwork
  storyLicenseAddress: `0x${string}`
  storyLicenseTokenAddress: `0x${string}`
  storyChainId: number
  constellationNetwork: ConstellationNetworkId
  constellationEnabled: boolean
}

type StepStatus = 'complete' | 'current' | 'upcoming' | 'failed'

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
  if (status === 'failed') {
    return <XCircle className='h-5 w-5 text-rose-500' aria-hidden='true' />
  }
  if (status === 'current') {
    return <Clock3 className='h-5 w-5 text-primary' aria-hidden='true' />
  }
  return <Circle className='h-5 w-5 text-muted-foreground' aria-hidden='true' />
}

export function FinalizationTimeline({
  ckbtcNetwork,
  storyNetwork,
  storyLicenseAddress,
  storyLicenseTokenAddress,
  storyChainId,
  constellationNetwork,
  constellationEnabled
}: FinalizationTimelineProps) {
  const { invoice } = useInvoiceStatus()

  const ckbtcSymbol = ckbtcNetwork === 'ckbtc-testnet' ? 'ckTESTBTC' : 'ckBTC'
  const paymentComplete =
    typeof invoice.ckbtcMintedSats === 'number' && invoice.ckbtcMintedSats > 0
  const licenseMinted =
    typeof invoice.tokenOnChainId === 'string' &&
    invoice.tokenOnChainId.trim().length > 0
  const normalizedConstellationStatus = (() => {
    const status = invoice.constellationStatus ?? null
    if (
      !status &&
      invoice.constellationTx &&
      invoice.constellationTx.length > 0
    ) {
      return 'ok'
    }
    if (status === 'disabled') {
      return 'skipped'
    }
    return status
  })()
  const constellationState =
    constellationEnabled === false
      ? 'complete'
      : normalizedConstellationStatus === 'failed'
        ? 'failed'
        : normalizedConstellationStatus === 'ok' ||
            normalizedConstellationStatus === 'skipped'
          ? 'complete'
          : 'pending'
  const auditLogged =
    typeof invoice.finalizedAt === 'number' && invoice.finalizedAt > 0
  const constellationError = invoice.constellationError ?? null

  const paymentDetails = useMemo(() => {
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
            Waiting for the ckBTC ledger to detect the authenticated transfer.
          </p>
        )}
        {invoice.btcAddress && (
          <p>
            Escrow account{' '}
            <span className='break-all font-mono text-foreground'>
              {invoice.btcAddress}
            </span>
            .
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
        {invoice.fundedAt && <p>Detected {formatDate(invoice.fundedAt)}.</p>}
      </div>
    )
  }, [
    ckbtcSymbol,
    invoice.btcAddress,
    invoice.ckbtcBlockIndex,
    invoice.ckbtcMintedSats,
    invoice.fundedAt
  ])

  const storyLinks = useMemo(() => {
    if (!licenseMinted) {
      return null
    }
    const tokenId = invoice.tokenOnChainId?.trim() ?? ''
    const tokenUrl = licenseTokenExplorerUrl(
      storyLicenseTokenAddress,
      tokenId,
      storyNetwork
    )
    const contractUrl = `${storyScanBase(storyNetwork)}/address/${storyLicenseAddress}`

    return { tokenUrl, contractUrl, tokenId }
  }, [
    invoice.tokenOnChainId,
    licenseMinted,
    storyLicenseAddress,
    storyLicenseTokenAddress,
    storyNetwork
  ])

  const constellationLinks = useMemo(() => {
    if (!constellationEnabled || !invoice.constellationTx) {
      return null
    }
    const txHash = invoice.constellationTx
    const explorerUrl =
      invoice.constellationExplorerUrl &&
      invoice.constellationExplorerUrl.length > 0
        ? invoice.constellationExplorerUrl
        : constellationExplorerUrl(constellationNetwork, txHash)
    return {
      explorerUrl,
      apiUrl: constellationTransactionApiUrl(constellationNetwork, txHash),
      txHash
    }
  }, [
    constellationEnabled,
    constellationNetwork,
    invoice.constellationAnchoredAt,
    invoice.constellationExplorerUrl,
    invoice.constellationTx
  ])

  const steps = useMemo(() => {
    type StepState = 'complete' | 'pending' | 'failed'
    const base: Array<{
      key: string
      title: string
      state: StepState
      content: JSX.Element
    }> = [
      {
        key: 'payment',
        title: 'Payment credited',
        state: paymentComplete ? 'complete' : 'pending',
        content: paymentDetails
      },
      {
        key: 'license',
        title: 'License token minted',
        state: licenseMinted ? 'complete' : 'pending',
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
                    {invoice.mintTo ?? 'pending wallet'}
                  </span>
                  {invoice.mintTo ? '.' : ' — save a wallet above.'}
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
                  <div className='flex flex-wrap gap-2'>
                    <Button asChild size='sm' variant='outline'>
                      <Link
                        href={storyLinks.tokenUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='gap-2'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                        View token on StoryScan
                      </Link>
                    </Button>
                    <Button asChild size='sm' variant='ghost'>
                      <Link
                        href={storyLinks.contractUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='gap-2'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                        View contract
                      </Link>
                    </Button>
                  </div>
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
        state:
          constellationState === 'failed'
            ? 'failed'
            : constellationState === 'complete'
              ? 'complete'
              : 'pending',
        content: (
          <div className='space-y-1 text-xs text-muted-foreground'>
            {constellationEnabled ? (
              constellationState === 'failed' ? (
                <p className='text-rose-600'>
                  Anchoring failed
                  {constellationError
                    ? `: ${constellationError}`
                    : '. Check operator logs for details.'}
                </p>
              ) : constellationLinks ? (
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
                  {invoice.constellationAnchoredAt && (
                    <p>
                      Anchored{' '}
                      <span className='font-semibold text-foreground'>
                        {formatDate(invoice.constellationAnchoredAt)}
                      </span>
                      .
                    </p>
                  )}
                  <div className='flex flex-wrap gap-2'>
                    <Button asChild size='sm' variant='outline'>
                      <Link
                        href={constellationLinks.explorerUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='gap-2'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                        Open explorer
                      </Link>
                    </Button>
                    <Button asChild size='sm' variant='ghost'>
                      <Link
                        href={constellationLinks.apiUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='gap-2'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                        View JSON payload
                      </Link>
                    </Button>
                  </div>
                </>
              ) : normalizedConstellationStatus === 'skipped' ? (
                <p>
                  Anchoring skipped
                  {constellationError ? `: ${constellationError}` : '.'}
                </p>
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
        state: auditLogged ? 'complete' : 'pending',
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
                  <div className='flex flex-wrap items-center gap-2'>
                    <Button asChild size='sm' variant='outline'>
                      <Link
                        href={invoice.c2paArchiveUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='gap-2'
                      >
                        <Download className='h-3.5 w-3.5' />
                        {invoice.c2paArchiveFileName ?? 'Download C2PA bundle'}
                      </Link>
                    </Button>
                    {formatBytes(invoice.c2paArchiveSize) && (
                      <Badge variant='outline'>
                        {formatBytes(invoice.c2paArchiveSize)}
                      </Badge>
                    )}
                  </div>
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

    let pendingFound = false
    return base.map(step => {
      let status: StepStatus
      if (step.state === 'failed') {
        status = 'failed'
        pendingFound = true
      } else if (step.state === 'complete') {
        status = 'complete'
      } else {
        status = pendingFound ? 'upcoming' : 'current'
        if (!pendingFound) {
          pendingFound = true
        }
      }
      return { ...step, status }
    })
  }, [
    auditLogged,
    constellationEnabled,
    constellationError,
    constellationLinks,
    constellationNetwork,
    constellationState,
    invoice.attestationHash,
    invoice.complianceScore,
    invoice.constellationAnchoredAt,
    invoice.c2paArchiveFileName,
    invoice.c2paArchiveSize,
    invoice.c2paArchiveUrl,
    invoice.finalizedAt,
    invoice.licenseTermsId,
    invoice.mintTo,
    invoice.orderId,
    invoice.tokenOnChainId,
    invoice.vcHash,
    licenseMinted,
    normalizedConstellationStatus,
    paymentComplete,
    paymentDetails,
    storyChainId,
    storyLicenseAddress,
    storyLinks
  ])

  return (
    <section className='space-y-6 rounded-3xl border border-border/60 bg-gradient-to-b from-background via-card to-card p-8 shadow-lg'>
      <header>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground/80'>
          Automated verification
        </p>
        <h2 className='text-2xl font-semibold text-foreground'>
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
            <div className='flex-1 rounded-2xl border border-border/50 bg-background/80 p-4 shadow-inner space-y-3'>
              <div className='flex flex-wrap items-center gap-3'>
                <p className='text-base font-semibold text-foreground'>
                  {step.title}
                </p>
                <Badge
                  variant={step.status === 'complete' ? 'default' : 'outline'}
                  className={
                    step.status === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : step.status === 'current'
                        ? 'border-primary/60 text-primary'
                        : step.status === 'failed'
                          ? 'border-rose-400 text-rose-600'
                          : 'text-muted-foreground'
                  }
                >
                  {step.status === 'complete'
                    ? 'Complete'
                    : step.status === 'current'
                      ? 'In progress'
                      : step.status === 'failed'
                        ? 'Failed'
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
