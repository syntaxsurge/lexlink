import { Eye, Sparkles } from 'lucide-react'

import { loadAuditTrail } from '@/app/dashboard/actions'
import { ComplianceTable } from '@/components/compliance/compliance-table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function CompliancePage() {
  const events = await loadAuditTrail(100)

  return (
    <div className='space-y-10'>
      {/* Hero Section */}
      <section className='relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-background p-10 shadow-2xl'>
        <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl' />
        <div className='absolute bottom-4 right-6 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='relative z-10 space-y-4'>
          <Badge
            variant='outline'
            className='w-fit border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary'
          >
            <Eye className='mr-2 h-3 w-3' />
            Compliance & Audit
          </Badge>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>
              Audit Trail
            </h1>
            <p className='max-w-2xl text-base text-muted-foreground'>
              Canonical evidence of all cross-chain actions executed inside
              LexLink. Complete transparency for compliance and verification.
            </p>
          </div>
        </div>
      </section>

      <Card className='rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card via-background to-card shadow-xl'>
        <CardHeader className='space-y-4 pb-6'>
          <div className='flex items-start gap-3'>
            <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-background p-3 shadow-lg'>
              <Sparkles className='h-6 w-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>
                Complete Activity Log
              </CardTitle>
              <CardDescription className='text-sm'>
                Every action, transaction, and state change recorded with
                cryptographic proof
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className='bg-gradient-to-r from-transparent via-border/50 to-transparent' />
        <CardContent className='pt-6'>
          <ComplianceTable events={events} />
        </CardContent>
      </Card>
    </div>
  )
}
