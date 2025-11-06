import { Buffer } from 'node:buffer'

import Link from 'next/link'

import {
  loadBuyerCkbtcBalance,
  loadBuyerProfile,
  loadBuyerPurchases
} from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
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

function short(value: string | null | undefined, length = 10) {
  if (!value) return '—'
  if (value.length <= length) return value
  return `${value.slice(0, length)}…`
}

export default async function PurchasesPage() {
  const [purchases, profile, balance] = await Promise.all([
    loadBuyerPurchases(),
    loadBuyerProfile(),
    loadBuyerCkbtcBalance()
  ])

  const storyNetwork =
    (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
  const storyLicenseToken =
    (env.STORY_LICENSE_TOKEN_ADDRESS as `0x${string}` | undefined) ?? null
  const constellationNetwork =
    (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Buyer Profile</CardTitle>
          <CardDescription>
            Storefront defaults for Internet Identity sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm'>
            <p className='text-xs uppercase text-muted-foreground'>
              Internet Identity Principal
            </p>
            <p className='font-mono text-xs'>{profile.principal}</p>
          </div>
          <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm'>
            <p className='text-xs uppercase text-muted-foreground'>
              Default License Wallet
            </p>
            <p className='font-mono text-xs'>
              {profile.defaultMintTo ?? 'Set during checkout'}
            </p>
            <p className='mt-2 text-xs text-muted-foreground'>
              Update this address the next time you finalize a payment. We use
              it to prefill future orders.
            </p>
          </div>
          <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm md:col-span-2'>
            <p className='text-xs uppercase text-muted-foreground'>
              ckBTC Balance
            </p>
            {balance.enabled ? (
              <div className='mt-1 flex items-baseline gap-3'>
                <span className='text-2xl font-semibold'>
                  {balance.formatted}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {balance.symbol} (principal {short(balance.principal, 8)})
                </span>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {balance.reason === 'ledger_unconfigured'
                  ? 'ckBTC ledger is not configured for this environment.'
                  : balance.reason}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>My Licenses</CardTitle>
          <CardDescription>
            Every invoice you claimed with this Internet Identity session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>License Wallet</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Story License</TableHead>
                <TableHead>Constellation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center text-sm text-muted-foreground'
                  >
                    No purchases recorded yet. When you pay an invoice, it will
                    appear here with Story and Constellation links.
                  </TableCell>
                </TableRow>
              )}
              {purchases.map(order => {
                const modeLabel =
                  order.paymentMode === 'ckbtc' ? 'ckBTC' : 'BTC'
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
                  <TableRow key={order.orderId}>
                    <TableCell className='font-mono text-xs'>
                      {order.orderId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='text-sm'>{order.ipTitle}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadge.variant}
                        className={statusBadge.className}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {order.mintTo ? short(order.mintTo, 12) : 'Pending'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{modeLabel}</Badge>
                    </TableCell>
                    <TableCell className='text-xs'>
                      <Link
                        href={storyLink}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary underline-offset-4 hover:underline'
                      >
                        {order.tokenOnChainId
                          ? `Token ${order.tokenOnChainId}`
                          : 'View IP'}
                      </Link>
                    </TableCell>
                    <TableCell className='text-xs'>
                      {constellationLink ? (
                        <Link
                          href={constellationLink}
                          target='_blank'
                          rel='noreferrer'
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          {short(order.constellationTx ?? null, 12)}
                        </Link>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='space-y-1 text-xs'>
                      <Link
                        href={receiptHref}
                        className='block text-primary underline-offset-4 hover:underline'
                      >
                        View receipt
                      </Link>
                      {order.status !== 'finalized' && (
                        <Link
                          href={`/pay/${order.orderId}`}
                          className='block text-primary underline-offset-4 hover:underline'
                        >
                          Review invoice
                        </Link>
                      )}
                      {c2paLink && (
                        <a
                          href={c2paLink}
                          download={c2paFileName}
                          className='block text-primary underline-offset-4 hover:underline'
                        >
                          Download C2PA
                        </a>
                      )}
                      {vcHref && (
                        <a
                          href={vcHref}
                          download={`lexlink-license-vc-${order.orderId}.json`}
                          className='block text-primary underline-offset-4 hover:underline'
                        >
                          Download VC
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
