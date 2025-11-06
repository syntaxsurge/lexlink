import { Buffer } from 'node:buffer'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { loadOrderReceipt } from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'
import {
  ipAssetExplorerUrl,
  licenseTokenExplorerUrl,
  type StoryNetwork
} from '@/lib/story-links'

const MAINNET_MEMPOOL = 'https://mempool.space'
const TESTNET_MEMPOOL = 'https://mempool.space/testnet'

function explorerBase(network?: string | null) {
  if (!network) return null
  if (network === 'mainnet') return MAINNET_MEMPOOL
  if (network.includes('mainnet')) return MAINNET_MEMPOOL
  return TESTNET_MEMPOOL
}

function statusStyles(status: string) {
  switch (status) {
    case 'finalized':
      return {
        variant: 'default' as const,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      }
    case 'funded':
    case 'confirmed':
      return {
        variant: 'default' as const,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      }
    case 'failed':
    case 'expired':
      return {
        variant: 'outline' as const,
        className: 'text-destructive border-destructive/40'
      }
    default:
      return {
        variant: 'outline' as const,
        className: ''
      }
  }
}

type VerifyPageParams = {
  params: Promise<{ orderId: string }>
}

export default async function VerifyOrderPage({ params }: VerifyPageParams) {
  const { orderId } = await params
  const receipt = await loadOrderReceipt(orderId)

  if (!receipt) {
    notFound()
  }

  const isCkbtc = receipt.paymentMode === 'ckbtc'
  const formattedAmount =
    typeof receipt.amountSats === 'number'
      ? (receipt.amountSats / 100_000_000).toFixed(6)
      : '—'

  const storyNetwork =
    (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
  const storyLicenseToken = env.STORY_LICENSE_TOKEN_ADDRESS as
    | `0x${string}`
    | undefined
  const storyLink =
    storyLicenseToken && receipt.tokenOnChainId
      ? licenseTokenExplorerUrl(
          storyLicenseToken,
          receipt.tokenOnChainId,
          storyNetwork
        )
      : ipAssetExplorerUrl(receipt.ipId, storyNetwork)

  const constellationNetwork =
    (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'
  const constellationLink =
    receipt.constellationExplorerUrl &&
    receipt.constellationExplorerUrl.length > 0
      ? receipt.constellationExplorerUrl
      : receipt.constellationTx
        ? constellationExplorerUrl(
            constellationNetwork,
            receipt.constellationTx
          )
        : null

  const btcExplorer = explorerBase(receipt.network)
  const btcTxLink =
    !isCkbtc && receipt.btcTxId && btcExplorer
      ? `${btcExplorer}/tx/${receipt.btcTxId}`
      : null
  const btcAddressLink =
    !isCkbtc && receipt.btcAddress && btcExplorer
      ? `${btcExplorer}/address/${receipt.btcAddress}`
      : null

  const vcDownloadHref = receipt.vcDocument
    ? `data:application/json;base64,${Buffer.from(
        receipt.vcDocument,
        'utf-8'
      ).toString('base64')}`
    : null

  let evidenceJson: string | null = null
  if (receipt.evidencePayload) {
    try {
      evidenceJson = JSON.stringify(
        JSON.parse(receipt.evidencePayload),
        null,
        2
      )
    } catch {
      evidenceJson = receipt.evidencePayload
    }
  }

  const statusBadge = statusStyles(receipt.status)
  const finalizedAt = receipt.finalizedAt
    ? new Date(receipt.finalizedAt).toLocaleString()
    : 'Pending'
  const fundedAt = receipt.fundedAt
    ? new Date(receipt.fundedAt).toLocaleString()
    : 'Pending'

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10'>
      <header className='space-y-3 text-center'>
        <Badge variant={statusBadge.variant} className={statusBadge.className}>
          {receipt.status}
        </Badge>
        <h1 className='text-3xl font-semibold tracking-tight'>
          License receipt · {orderId.slice(0, 10)}…
        </h1>
        <p className='text-sm text-muted-foreground'>
          Independent proof covering payment, Story license minting, and
          evidence anchoring for order {orderId}.
        </p>
      </header>

      <Card className='border-border/60 bg-card/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Key identifiers for auditors, partners, and downstream licensors.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>IP Asset</p>
            <p className='text-sm font-medium'>{receipt.ipTitle}</p>
            <Link
              href={storyLink}
              target='_blank'
              rel='noreferrer'
              className='text-xs text-primary underline-offset-4 hover:underline'
            >
              View on Story explorer
            </Link>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Licensed to
            </p>
            <p className='font-mono text-xs'>
              {receipt.mintTo ?? receipt.buyer ?? 'Pending'}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Story License Token
            </p>
            <p className='font-mono text-xs'>
              {receipt.tokenOnChainId ?? 'Pending'}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Payment mode
            </p>
            <p className='font-medium'>
              {isCkbtc ? 'ckBTC (ICP ledger)' : 'Native Bitcoin'}
            </p>
            <p className='text-xs text-muted-foreground'>
              Amount:{' '}
              <span className='font-mono'>
                {formattedAmount} BTC (
                {receipt.amountSats?.toLocaleString() ?? '—'} sats)
              </span>
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Finalized at
            </p>
            <p className='text-sm text-foreground'>{finalizedAt}</p>
            <p className='text-xs text-muted-foreground'>
              Funded at: {fundedAt}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>
              Compliance score
            </p>
            <p className='text-sm font-semibold'>
              {typeof receipt.complianceScore === 'number'
                ? `${receipt.complianceScore}/100`
                : 'Pending'}
            </p>
            <p className='text-xs text-muted-foreground'>
              Training units logged:{' '}
              {typeof receipt.trainingUnits === 'number'
                ? receipt.trainingUnits.toLocaleString()
                : '0'}
            </p>
          </div>
          {receipt.constellationAnchoredAt && (
            <p className='text-xs text-muted-foreground'>
              Constellation anchoring completed{' '}
              {new Date(receipt.constellationAnchoredAt).toLocaleString()}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Settlement Proof</CardTitle>
          <CardDescription>
            Ledger references for the Bitcoin or ckBTC payment component.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {isCkbtc ? (
            <>
              <div className='rounded-md border border-border/60 bg-muted/20 p-3 text-sm'>
                <p className='text-xs uppercase text-muted-foreground'>
                  ckBTC escrow account
                </p>
                <p className='break-all font-mono text-xs'>
                  {receipt.btcAddress}
                </p>
                {typeof receipt.ckbtcMintedSats === 'number' && (
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Minted: {receipt.ckbtcMintedSats.toLocaleString()} sats ·
                    Ledger block{' '}
                    {receipt.ckbtcBlockIndex
                      ? receipt.ckbtcBlockIndex.toLocaleString()
                      : 'pending'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className='space-y-3 text-sm'>
              <div>
                <p className='text-xs uppercase text-muted-foreground'>
                  Bitcoin deposit address
                </p>
                <p className='break-all font-mono text-xs'>
                  {receipt.btcAddress}
                </p>
                {btcAddressLink && (
                  <Link
                    href={btcAddressLink}
                    target='_blank'
                    rel='noreferrer'
                    className='text-xs text-primary underline-offset-4 hover:underline'
                  >
                    View on mempool.space
                  </Link>
                )}
              </div>
              <div>
                <p className='text-xs uppercase text-muted-foreground'>
                  Transaction reference
                </p>
                {receipt.btcTxId ? (
                  <Link
                    href={btcTxLink ?? '#'}
                    target='_blank'
                    rel='noreferrer'
                    className='font-mono text-xs text-primary underline-offset-4 hover:underline'
                  >
                    {receipt.btcTxId}
                  </Link>
                ) : (
                  <p className='font-mono text-xs'>Pending</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Evidence & Artifacts</CardTitle>
          <CardDescription>
            Hashes and downloads that prove what was licensed and when.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                Attestation hash
              </p>
              <p className='break-all font-mono text-xs'>
                {receipt.attestationHash ?? 'Unavailable'}
              </p>
            </div>
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                Asset content hash
              </p>
              <p className='break-all font-mono text-xs'>
                {receipt.contentHash ?? 'Unavailable'}
              </p>
            </div>
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                C2PA manifest hash
              </p>
              <p className='break-all font-mono text-xs'>
                {receipt.c2paHash ?? 'Unavailable'}
              </p>
            </div>
            <div>
              <p className='text-xs uppercase text-muted-foreground'>
                Verifiable credential hash
              </p>
              <p className='break-all font-mono text-xs'>
                {receipt.vcHash ?? 'Unavailable'}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {receipt.c2paArchiveUrl && (
              <Button asChild size='sm' variant='secondary'>
                <Link
                  href={receipt.c2paArchiveUrl}
                  target='_blank'
                  rel='noreferrer'
                  download={
                    receipt.c2paArchiveFileName ??
                    `lexlink-license-${orderId}.zip`
                  }
                >
                  Download C2PA bundle
                </Link>
              </Button>
            )}
            {vcDownloadHref && (
              <Button asChild size='sm' variant='secondary'>
                <a
                  href={vcDownloadHref}
                  download={`lexlink-license-vc-${orderId}.json`}
                >
                  Download verifiable credential
                </a>
              </Button>
            )}
            {constellationLink && (
              <Button asChild size='sm' variant='outline'>
                <Link href={constellationLink} target='_blank' rel='noreferrer'>
                  Constellation transaction
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {evidenceJson && (
        <Card className='border-border/60 bg-card/60 shadow-sm'>
          <CardHeader>
            <CardTitle>Evidence payload</CardTitle>
            <CardDescription>
              Canonical JSON bundled into the Constellation anchoring event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className='max-h-[360px] overflow-auto rounded-md bg-muted/60 p-4 text-xs'>
              {evidenceJson}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
