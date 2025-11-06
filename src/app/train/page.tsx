import Link from 'next/link'

import {
  loadDashboardData,
  type IpRecord,
  type LicenseRecord,
  type TrainingBatchRecord
} from '@/app/dashboard/actions'
import { TrainingForm } from '@/components/app/training-form'
import {
  constellationExplorerUrl,
  type ConstellationNetworkId
} from '@/lib/constellation-links'
import { env } from '@/lib/env'

const CONSTELLATION_NETWORK =
  (env.CONSTELLATION_NETWORK as ConstellationNetworkId) ?? 'integrationnet'

function groupTraining(
  ips: IpRecord[],
  licenses: LicenseRecord[],
  trainingBatches: TrainingBatchRecord[]
) {
  return ips.map(ip => {
    const matchingBatches = trainingBatches.filter(
      batch => batch.ipId === ip.ipId
    )
    const matchingLicenses = licenses.filter(
      license => license.ipId === ip.ipId
    )
    const totalUnits = matchingBatches.reduce(
      (sum, batch) => sum + batch.units,
      0
    )
    const avgCompliance = matchingLicenses.length
      ? Math.round(
          matchingLicenses.reduce(
            (sum, license) => sum + license.complianceScore,
            0
          ) / matchingLicenses.length
        )
      : 0
    return {
      ip,
      totalUnits,
      avgCompliance,
      batches: matchingBatches
    }
  })
}

export default async function TrainingPage() {
  const { ips, licenses, trainingBatches } = await loadDashboardData()
  const grouped = groupTraining(ips, licenses, trainingBatches)

  return (
    <div className='space-y-10'>
      <section className='rounded-2xl border bg-muted/20 p-6'>
        <h1 className='text-3xl font-semibold'>AI Training Meter</h1>
        <p className='mt-2 max-w-3xl text-sm text-muted-foreground'>
          Stream micro-payments back to Story-licensed IP and anchor each
          training batch to Constellation. Every recorded batch increases the
          license passport score.
        </p>
      </section>

      <section>
        <TrainingForm ips={ips} />
      </section>

      <section className='space-y-6'>
        {grouped.map(({ ip, totalUnits, avgCompliance, batches }) => (
          <div key={ip.ipId} className='rounded-xl border bg-card p-6'>
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='text-lg font-semibold'>{ip.title}</h2>
                <p className='break-all text-xs text-muted-foreground'>
                  {ip.ipId}
                </p>
              </div>
              <div className='flex gap-6 text-sm'>
                <span className='font-medium'>Units: {totalUnits}</span>
                <span className='font-medium'>
                  Avg. Compliance: {avgCompliance}/100
                </span>
              </div>
            </div>
            <div className='mt-4 space-y-2 text-xs'>
              {batches.length === 0 && (
                <p className='text-muted-foreground'>No batches recorded.</p>
              )}
              {batches.map(batch => (
                <div
                  key={batch.batchId}
                  className='rounded-lg border bg-muted/30 p-3 font-mono'
                >
                  <div className='flex items-center justify-between text-sm font-semibold'>
                    <span>Batch {batch.batchId.slice(0, 8)}…</span>
                    <span>{batch.units.toLocaleString()} units</span>
                  </div>
                  <dl className='mt-1 space-y-1'>
                    <div>
                      <dt className='text-muted-foreground'>
                        Constellation Tx
                      </dt>
                      <dd className='break-all'>
                        {batch.constellationExplorerUrl && batch.constellationExplorerUrl.length > 0 ? (
                          <Link
                            href={batch.constellationExplorerUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary underline-offset-4 hover:underline'
                          >
                            {batch.constellationTx}
                          </Link>
                        ) : batch.constellationTx ? (
                          batch.constellationTx
                        ) : (
                          'pending'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Evidence Hash</dt>
                      <dd className='break-all'>{batch.evidenceHash}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Recorded</dt>
                      <dd>{new Date(batch.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
