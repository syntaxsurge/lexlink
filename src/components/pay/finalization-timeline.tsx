'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  XCircle,
  Sparkles,
  Rocket,
  Shield,
  FileCheck
} from 'lucide-react'

import { useInvoiceStatus } from '@/components/pay/invoice-status-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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

const STEP_ICONS = {
  payment: Sparkles,
  license: Rocket,
  constellation: Shield,
  audit: FileCheck
}

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

export function FinalizationTimeline({
  ckbtcNetwork,
  storyNetwork,
  storyLicenseAddress,
  storyLicenseTokenAddress,
  storyChainId,
  constellationNetwork,
  constellationEnabled
}: FinalizationTimelineProps) {
  const { invoice, pollFinalization, refresh, isFinalizing } =
    useInvoiceStatus()
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)

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
    normalizedConstellationStatus,
    invoice.vcHash,
    licenseMinted,
    paymentComplete,
    paymentDetails,
    storyChainId,
    storyLicenseAddress,
    storyLinks
  ])

  const completedSteps = steps.filter(s => s.status === 'complete').length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const handleRetry = useCallback(async () => {
    setRetryError(null)
    setRetryMessage(null)
    try {
      const result = await pollFinalization()
      if (result?.status === 'finalized') {
        setRetryMessage('Order finalized successfully.')
      } else {
        setRetryMessage('Retry requested. Monitoring automated steps…')
      }
    } catch (error) {
      setRetryError(
        error instanceof Error
          ? error.message
          : 'Unable to trigger a finalization retry.'
      )
    } finally {
      await refresh().catch(() => {
        // background refresh handles errors
      })
    }
  }, [pollFinalization, refresh])

  const canRetryFinalization =
    invoice.status !== 'finalized' &&
    (constellationState === 'failed' ||
      normalizedConstellationStatus === 'failed' ||
      invoice.status === 'failed')

  useEffect(() => {
    if (invoice.status === 'finalized') {
      setRetryMessage(null)
      setRetryError(null)
    }
  }, [invoice.status])

  return (
    <section className='relative space-y-10 overflow-hidden rounded-[48px] border-2 border-border/60 bg-gradient-to-br from-primary/5 via-background to-card p-12 shadow-2xl'>
      {/* Decorative Elements */}
      <div className='pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 via-emerald-400/20 to-transparent blur-3xl' />
      <div className='pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-400/20 via-primary/10 to-transparent blur-3xl' />

      {/* Header with Progress */}
      <header className='relative z-10 space-y-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-4'>
            <Badge
              variant='outline'
              className='border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-primary'
            >
              <Sparkles className='mr-2 h-3 w-3' />
              Automated Verification
            </Badge>
            <div className='space-y-2'>
              <h2 className='text-4xl font-bold tracking-tight text-foreground'>
                Verification Timeline
              </h2>
              <p className='max-w-3xl text-base leading-relaxed text-muted-foreground'>
                Track each automated action after payment lands. Your license
                token will be minted automatically once all steps complete
                successfully.
              </p>
            </div>
          </div>
          {canRetryFinalization ? (
            <div className='flex w-full flex-col gap-2 lg:w-auto'>
              <Button
                type='button'
                variant='outline'
                className='gap-2 rounded-full border-primary/40 px-5 text-sm font-semibold text-primary hover:bg-primary/10'
                disabled={isFinalizing}
                onClick={handleRetry}
              >
                {isFinalizing ? 'Retrying…' : 'Retry finalization'}
              </Button>
              {retryMessage && (
                <p className='text-xs text-emerald-500 dark:text-emerald-300'>
                  {retryMessage}
                </p>
              )}
              {retryError && (
                <p className='text-xs text-rose-500 dark:text-rose-400'>
                  {retryError}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Overall Progress Card */}
        <div className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-background/95 via-card/80 to-background/95 p-6 shadow-xl backdrop-blur-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 p-3'>
                <Rocket className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='text-sm font-semibold text-muted-foreground'>
                  Overall Progress
                </p>
                <p className='text-2xl font-bold text-foreground'>
                  {completedSteps} of {totalSteps} Complete
                </p>
              </div>
            </div>
            <Badge
              variant='outline'
              className={`px-4 py-2 text-lg font-bold ${
                completedSteps === totalSteps
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-primary/40 bg-primary/10 text-primary'
              }`}
            >
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
          <Progress value={progressPercentage} className='h-3 bg-muted/50' />
          <div className='mt-3 flex items-center gap-2 text-xs text-muted-foreground'>
            <Clock3 className='h-3.5 w-3.5' />
            <span>Automated processing • No action required</span>
          </div>
        </div>
      </header>

      <Separator className='bg-gradient-to-r from-transparent via-border to-transparent' />

      {/* Timeline Steps */}
      <ol className='relative z-10 space-y-8'>
        {steps.map((step, index) => {
          const StepIcon =
            STEP_ICONS[step.key as keyof typeof STEP_ICONS] || Circle
          const isLast = index === steps.length - 1

          return (
            <li key={step.key} className='group relative flex gap-6'>
              {/* Timeline Connector */}
              <div className='relative flex flex-col items-center'>
                {/* Icon Container */}
                <div
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-lg transition-all duration-300 group-hover:scale-110 ${
                    step.status === 'complete'
                      ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20'
                      : step.status === 'current'
                        ? 'animate-pulse border-sky-500/60 bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sky-500/30'
                        : step.status === 'failed'
                          ? 'border-rose-500/50 bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/20'
                          : 'border-border/60 bg-gradient-to-br from-muted to-muted/80'
                  }`}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle2 className='h-6 w-6 text-white' />
                  ) : step.status === 'failed' ? (
                    <XCircle className='h-6 w-6 text-white' />
                  ) : step.status === 'current' ? (
                    <StepIcon className='h-6 w-6 text-white' />
                  ) : (
                    <StepIcon className='h-6 w-6 text-muted-foreground' />
                  )}
                </div>

                {/* Vertical Line */}
                {!isLast && (
                  <div className='mt-3 h-full w-1 rounded-full bg-gradient-to-b from-border/60 via-border/30 to-transparent' />
                )}
              </div>

              {/* Step Content Card */}
              <div className='flex-1 space-y-4 pb-8'>
                {/* Card Header */}
                <div
                  className={`rounded-3xl border-2 p-6 shadow-xl transition-all duration-300 group-hover:shadow-2xl ${
                    step.status === 'complete'
                      ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-card'
                      : step.status === 'current'
                        ? 'border-primary/30 bg-gradient-to-br from-primary/10 via-background to-card'
                        : step.status === 'failed'
                          ? 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-background to-card'
                          : 'border-border/40 bg-gradient-to-br from-muted/20 via-background to-card'
                  }`}
                >
                  <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-3'>
                        <h3 className='text-xl font-bold text-foreground'>
                          {step.title}
                        </h3>
                        <Badge
                          variant={
                            step.status === 'complete' ? 'default' : 'outline'
                          }
                          className={`px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            step.status === 'complete'
                              ? 'border-emerald-500/40 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : step.status === 'current'
                                ? 'border-sky-500/70 bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30'
                                : step.status === 'failed'
                                  ? 'border-rose-500/40 bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                  : 'border-border/60 bg-muted text-muted-foreground'
                          }`}
                        >
                          {step.status === 'complete'
                            ? '✓ Complete'
                            : step.status === 'current'
                              ? '◐ In Progress'
                              : step.status === 'failed'
                                ? '✕ Failed'
                                : '○ Waiting'}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Step {index + 1} of {totalSteps}
                      </p>
                    </div>
                  </div>

                  <Separator className='my-4 bg-gradient-to-r from-transparent via-border/50 to-transparent' />

                  {/* Step Details */}
                  <div className='space-y-4 rounded-2xl border border-border/30 bg-background/60 p-5 backdrop-blur-sm'>
                    {step.content}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Completion Message */}
      {completedSteps === totalSteps && (
        <div className='relative z-10 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-card p-8 text-center shadow-2xl'>
          <div className='mb-4 flex justify-center'>
            <div className='rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/20'>
              <CheckCircle2 className='h-8 w-8 text-white' />
            </div>
          </div>
          <h3 className='mb-2 text-2xl font-bold text-foreground'>
            Verification Complete!
          </h3>
          <p className='text-muted-foreground'>
            All automated steps have been completed successfully. Your license
            token has been minted and is ready to use.
          </p>
        </div>
      )}
    </section>
  )
}
