import { loadAuditTrail } from '@/app/dashboard/actions'
import { ComplianceTable } from '@/components/compliance/compliance-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export default async function CompliancePage() {
  const events = await loadAuditTrail(100)

  return (
    <div className='space-y-6'>
      <Card className='border-border/60 bg-card/60'>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Canonical evidence of all cross-chain actions executed inside
            LexLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceTable events={events} />
        </CardContent>
      </Card>
    </div>
  )
}
