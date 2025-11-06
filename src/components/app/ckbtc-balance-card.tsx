import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import type { CkbtcSnapshot } from '@/app/dashboard/actions'

export function CkbtcBalanceCard({ snapshot }: { snapshot: CkbtcSnapshot }) {
  if (!snapshot.enabled) {
    return (
      <Card className='border-border/60 bg-card/70'>
        <CardHeader className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>ckBTC Balances</CardTitle>
            <Badge variant='outline'>ckBTC</Badge>
          </div>
          <CardDescription>
            Configure ckBTC canister IDs to surface wallet telemetry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            {snapshot.error ??
              'Set CKBTC_LEDGER_CANISTER_ID (or ICP_CKBTC_LEDGER_CANISTER_ID) and ICP_HOST to a live replica.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const warnings =
    snapshot.warnings.length > 0 ? snapshot.warnings.slice(0, 3) : []

  return (
    <Card className='border-border/60 bg-card/70'>
      <CardHeader className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>ckBTC Balances</CardTitle>
          <Badge variant='outline'>{snapshot.symbol}</Badge>
        </div>
        <CardDescription>
          Operator wallet and escrow exposure on the {snapshot.network} bridge.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <div className='rounded-lg border border-border/50 bg-muted/20 p-3'>
          <p className='text-xs uppercase text-muted-foreground'>Operator</p>
          <p className='text-lg font-semibold'>{snapshot.operator.formatted}</p>
          <p className='text-xs text-muted-foreground break-all'>
            {snapshot.operator.principal}
          </p>
        </div>
        {snapshot.escrow ? (
          <div className='rounded-lg border border-border/50 bg-muted/20 p-3'>
            <p className='text-xs uppercase text-muted-foreground'>Escrow · open orders</p>
            <p className='text-lg font-semibold'>
              {snapshot.escrow.formattedOpenBalance}
            </p>
            <p className='text-xs text-muted-foreground'>
              {snapshot.escrow.openOrders.length} open invoice
              {snapshot.escrow.openOrders.length === 1 ? '' : 's'}
            </p>
          </div>
        ) : (
          <div className='rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground'>
            <p>No escrow principal configured.</p>
          </div>
        )}
        {warnings.length > 0 && (
          <div className='sm:col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500'>
            <p className='font-semibold'>Ledger warnings</p>
            <ul className='mt-1 list-disc space-y-1 pl-4'>
              {warnings.map(detail => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
        <div className='sm:col-span-2 rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground'>
          Need ckTESTBTC? Open{' '}
          <a
            className='font-medium text-primary underline-offset-4 hover:underline'
            href='https://testnet-faucet.ckboost.com/'
            target='_blank'
            rel='noreferrer'
          >
            testnet-faucet.ckboost.com
          </a>
          , paste your operator principal above, and mint directly to the ledger.
        </div>
      </CardContent>
    </Card>
  )
}
