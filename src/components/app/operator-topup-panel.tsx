'use client'

import type { CkbtcSnapshot } from '@/app/dashboard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const CKBTC_FAUCET_URL = 'https://testnet-faucet.ckboost.com/'

export function OperatorTopUpPanel({ snapshot }: { snapshot: CkbtcSnapshot }) {
  if (!snapshot.enabled) {
    return null
  }

  return (
    <Card className='border-border/60 bg-card/70'>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Fund Operator ckBTC</CardTitle>
          <Badge variant='outline'>{snapshot.network}</Badge>
        </div>
        <CardDescription>
          Use the public ckTESTBTC faucet and send funds directly to your
          Internet Identity.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <div className='space-y-2 rounded-md border border-border/60 bg-muted/10 p-3'>
          <p className='text-xs uppercase text-muted-foreground'>
            Operator principal
          </p>
          <p className='break-all font-mono text-xs'>
            {snapshot.operator.principal}
          </p>
        </div>
        <div className='space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground'>
          <p className='font-semibold text-foreground'>How to top up</p>
          <ol className='list-decimal space-y-2 pl-4'>
            <li>Open the ckBTC faucet and paste your operator principal.</li>
            <li>Mint ckTESTBTC to the principal directly.</li>
            <li>
              Refresh the dashboard to see balances update from the ledger.
            </li>
          </ol>
          <Button asChild variant='secondary' size='sm' className='w-fit'>
            <a href={CKBTC_FAUCET_URL} target='_blank' rel='noreferrer'>
              Visit ckBTC faucet
            </a>
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          No more deposit allocation or minter polling is required—balances
          update as soon as the ledger records your faucet transfer.
        </p>
      </CardContent>
    </Card>
  )
}
