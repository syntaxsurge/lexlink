import Link from 'next/link'

import {
  loadBuyerCkbtcBalance,
  loadBuyerProfile,
  loadBuyerPurchases
} from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { env } from '@/lib/env'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
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

  const storyNetwork = (env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'
  const storyLicenseTemplate =
    (env.STORY_LICENSE_TEMPLATE_ADDRESS as `0x${string}` | undefined) ?? null
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
              Update this address the next time you finalize a payment. We use it to prefill future orders.
            </p>
          </div>
          <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm md:col-span-2'>
            <p className='text-xs uppercase text-muted-foreground'>ckBTC Balance</p>
            {balance.enabled ? (
              <div className='mt-1 flex items-baseline gap-3'>
                <span className='text-2xl font-semibold'>{balance.formatted}</span>
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
                    No purchases recorded yet. When you pay an invoice, it will appear here with Story and Constellation links.
                  </TableCell>
                </TableRow>
              )}
              {purchases.map(order => {
                const modeLabel = order.paymentMode === 'ckbtc' ? 'ckBTC' : 'BTC'
                const storyLink =
                  storyLicenseTemplate && order.tokenOnChainId
                    ? licenseTokenExplorerUrl(
                        storyLicenseTemplate,
                        order.tokenOnChainId,
                        storyNetwork
                      )
                    : ipAssetExplorerUrl(order.ipId, storyNetwork)
                const constellationLink =
                  order.constellationTx?.length
                    ? constellationExplorerUrl(
                        constellationNetwork,
                        order.constellationTx
                      )
                    : null
                const statusBadge =
                  order.status === 'finalized'
                    ? { variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
                    : order.status === 'pending'
                      ? { variant: 'outline' as const, className: '' }
                      : { variant: 'outline' as const, className: '' }
                return (
                  <TableRow key={order.orderId}>
                    <TableCell className='font-mono text-xs'>
                      {order.orderId.slice(0, 10)}…
                    </TableCell>
                    <TableCell className='text-sm'>
                      {order.ipTitle}
                    </TableCell>
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
                          {short(order.constellationTx, 12)}
                        </Link>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {order.status === 'finalized' ? (
                        <span className='text-muted-foreground'>Settled</span>
                      ) : (
                        <Link
                          href={`/pay/${order.orderId}`}
                          className='text-primary underline-offset-4 hover:underline'
                        >
                          Review invoice
                        </Link>
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
