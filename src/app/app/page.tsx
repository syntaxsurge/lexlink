import { Buffer } from 'node:buffer'

import {
  loadDashboardData,
  type DisputeRecord,
  type IpRecord,
  type LicenseRecord
} from '@/app/app/actions'
import { DisputeForm } from '@/components/app/dispute-form'
import { FinalizeLicenseForm } from '@/components/app/finalize-license-form'
import { LicenseOrderForm } from '@/components/app/license-order-form'
import { RegisterIpForm } from '@/components/app/register-ip-form'
import { Button } from '@/components/ui/button'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString()
}

const STORY_EXPLORER_BASE = 'https://aeneid.explorer.story.foundation/ipa/'

export default async function AppPage() {
  const { ips, licenses, disputes, trainingBatches } = await loadDashboardData()
  const awaitingOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'awaiting_payment'
  )
  const completedOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'completed'
  )
  const averageCompliance = completedOrders.length
    ? Math.round(
        completedOrders.reduce(
          (sum, license) => sum + license.complianceScore,
          0
        ) / completedOrders.length
      )
    : 0
  const totalTrainingUnits = licenses.reduce(
    (sum, license) => sum + (license.trainingUnits ?? 0),
    0
  )

  return (
    <div className='space-y-10'>
      <section className='rounded-2xl border bg-muted/20 p-6'>
        <h1 className='text-3xl font-semibold'>LexLink Console</h1>
        <p className='mt-2 max-w-3xl text-sm text-muted-foreground'>
          Register Story Protocol IP assets, allocate Bitcoin deposit addresses
          via the ICP escrow canister, and publish immutable evidence to
          Constellation IntegrationNet once payments clear. All records below
          are synced from the configured Convex deployment, so the console can
          be used by multi-user teams.
        </p>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-xl border bg-card p-5'>
          <p className='text-sm font-semibold text-muted-foreground'>
            Average Compliance Score
          </p>
          <p className='mt-2 text-3xl font-bold'>{averageCompliance}/100</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Calculated from completed licenses.
          </p>
        </div>
        <div className='rounded-xl border bg-card p-5'>
          <p className='text-sm font-semibold text-muted-foreground'>
            Recorded Training Units
          </p>
          <p className='mt-2 text-3xl font-bold'>
            {totalTrainingUnits.toLocaleString()}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Sum of batched AI training attestations.
          </p>
        </div>
        <div className='rounded-xl border bg-card p-5'>
          <p className='text-sm font-semibold text-muted-foreground'>
            Open Disputes
          </p>
          <p className='mt-2 text-3xl font-bold'>
            {disputes.filter(dispute => dispute.status === 'raised').length}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Raised on Story&apos;s UMA-backed dispute module.
          </p>
        </div>
      </section>

      <section className='grid gap-8 lg:grid-cols-2'>
        <RegisterIpForm />
        <LicenseOrderForm ips={ips} />
      </section>

      <section className='grid gap-8 lg:grid-cols-2'>
        <DisputeForm ips={ips} />
        <div className='rounded-xl border bg-card p-6'>
          <h3 className='text-lg font-semibold'>Dispute History</h3>
          <div className='mt-4 divide-y divide-border border-t text-sm'>
            {disputes.length === 0 && (
              <p className='py-4 text-muted-foreground'>
                No disputes submitted yet.
              </p>
            )}
            {disputes.map((dispute: DisputeRecord) => (
              <div key={dispute.disputeId} className='py-4'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    #{dispute.disputeId.slice(0, 8)}…
                  </span>
                  <span className='rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/70'>
                    {dispute.status}
                  </span>
                </div>
                <dl className='mt-3 grid gap-1 font-mono text-xs'>
                  <div>
                    <dt className='text-muted-foreground'>IP ID</dt>
                    <dd className='break-all'>{dispute.ipId}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Tag</dt>
                    <dd>{dispute.targetTag}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Evidence CID</dt>
                    <dd className='break-all'>{dispute.evidenceCid}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Tx Hash</dt>
                    <dd className='break-all'>
                      {dispute.txHash || 'pending signature'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Evidence Hash</dt>
                    <dd className='break-all'>{dispute.evidenceHash}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Constellation Tx</dt>
                    <dd className='break-all'>
                      {dispute.constellationTx || 'pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Created</dt>
                    <dd>{formatDate(dispute.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className='text-xl font-semibold'>Registered IP Assets</h2>
        <div className='mt-4 overflow-x-auto rounded-xl border'>
          <table className='min-w-full divide-y divide-border text-sm'>
            <thead className='bg-muted/40'>
              <tr>
                <th className='px-4 py-2 text-left font-medium'>Title</th>
                <th className='px-4 py-2 text-left font-medium'>IP ID</th>
                <th className='px-4 py-2 text-left font-medium'>
                  License Terms
                </th>
                <th className='px-4 py-2 text-left font-medium'>
                  Price (sats)
                </th>
                <th className='px-4 py-2 text-left font-medium'>Royalty</th>
                <th className='px-4 py-2 text-left font-medium'>Media Type</th>
                <th className='px-4 py-2 text-left font-medium'>Assets</th>
                <th className='px-4 py-2 text-left font-medium'>Created</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border bg-card'>
              {ips.length === 0 && (
                <tr>
                  <td
                    className='px-4 py-6 text-center text-muted-foreground'
                    colSpan={8}
                  >
                    No IP assets registered yet.
                  </td>
                </tr>
              )}
              {ips.map((ip: IpRecord) => (
                <tr key={ip.ipId}>
                  <td className='px-4 py-3 font-medium'>{ip.title}</td>
                  <td className='px-4 py-3 font-mono text-xs'>{ip.ipId}</td>
                  <td className='px-4 py-3 font-mono text-xs'>
                    {ip.licenseTermsId}
                  </td>
                  <td className='px-4 py-3'>{ip.priceSats.toLocaleString()}</td>
                  <td className='px-4 py-3'>
                    {(ip.royaltyBps / 100).toFixed(2)}%
                  </td>
                  <td className='px-4 py-3'>{ip.mediaType}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-2 text-xs'>
                      <Button asChild size='sm' variant='ghost'>
                        <a href={ip.mediaUrl} target='_blank' rel='noreferrer'>
                          Media
                        </a>
                      </Button>
                      <Button asChild size='sm' variant='ghost'>
                        <a
                          href={ip.ipMetadataUri}
                          target='_blank'
                          rel='noreferrer'
                        >
                          IP Metadata
                        </a>
                      </Button>
                      <Button asChild size='sm' variant='ghost'>
                        <a
                          href={ip.nftMetadataUri}
                          target='_blank'
                          rel='noreferrer'
                        >
                          NFT Metadata
                        </a>
                      </Button>
                    </div>
                  </td>
                  <td className='px-4 py-3'>{formatDate(ip.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className='grid gap-8 lg:grid-cols-2'>
        <FinalizeLicenseForm orders={awaitingOrders} />
        <div className='rounded-xl border bg-card p-6'>
          <h3 className='text-lg font-semibold'>Completed Licenses</h3>
          <div className='mt-4 space-y-4 text-sm'>
            {completedOrders.length === 0 && (
              <p className='text-muted-foreground'>No completed sales yet.</p>
            )}
            {completedOrders.map((order: LicenseRecord) => {
              const c2paHref = order.c2paArchive
                ? `data:application/zip;base64,${order.c2paArchive}`
                : null
              const vcHref = order.vcDocument
                ? `data:application/json;base64,${Buffer.from(
                    order.vcDocument,
                    'utf-8'
                  ).toString('base64')}`
                : null
              return (
                <div
                  key={order.orderId}
                  className='rounded-lg border bg-muted/30 p-4'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>
                      Order {order.orderId.slice(0, 8)}…
                    </span>
                    <Button asChild variant='ghost' size='sm'>
                      <a
                        href={`${STORY_EXPLORER_BASE}${order.ipId}`}
                        target='_blank'
                        rel='noreferrer'
                      >
                        View on Explorer
                      </a>
                    </Button>
                  </div>
                  <dl className='mt-3 space-y-1 font-mono text-xs'>
                    <div>
                      <dt className='text-muted-foreground'>IP ID</dt>
                      <dd className='break-all'>{order.ipId}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Bitcoin Tx</dt>
                      <dd className='break-all'>{order.btcTxId}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>
                        Attestation Hash
                      </dt>
                      <dd className='break-all'>{order.attestationHash}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>
                        Constellation Tx
                      </dt>
                      <dd className='break-all'>{order.constellationTx}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Token ID</dt>
                      <dd className='break-all'>{order.tokenOnChainId}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Content Hash</dt>
                      <dd className='break-all'>{order.contentHash}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>
                        Compliance Score
                      </dt>
                      <dd>{order.complianceScore}/100</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>Training Units</dt>
                      <dd>{order.trainingUnits.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>C2PA Hash</dt>
                      <dd className='break-all'>{order.c2paHash}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>VC Hash</dt>
                      <dd className='break-all'>{order.vcHash}</dd>
                    </div>
                  </dl>
                  <div className='mt-4 flex flex-wrap gap-2 text-xs'>
                    {c2paHref && (
                      <Button asChild size='sm' variant='secondary'>
                        <a
                          href={c2paHref}
                          download={`lexlink-license-${order.orderId}.zip`}
                        >
                          Download C2PA
                        </a>
                      </Button>
                    )}
                    {vcHref && (
                      <Button asChild size='sm' variant='secondary'>
                        <a
                          href={vcHref}
                          download={`lexlink-vc-${order.orderId}.json`}
                        >
                          Download VC
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className='rounded-xl border bg-card p-6'>
        <h3 className='text-lg font-semibold'>Training Meter Activity</h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Every batch emits a Constellation heartbeat and increments the
          compliance bonus (max 25 points).
        </p>
        <div className='mt-4 space-y-3 text-xs'>
          {trainingBatches.length === 0 && (
            <p className='text-muted-foreground'>
              No training batches recorded yet.
            </p>
          )}
          {trainingBatches.map(batch => (
            <div
              key={batch.batchId}
              className='rounded-lg border bg-muted/30 p-4 font-mono'
            >
              <div className='flex items-center justify-between text-sm font-semibold'>
                <span>Batch {batch.batchId.slice(0, 8)}…</span>
                <span>{batch.units.toLocaleString()} units</span>
              </div>
              <dl className='mt-2 space-y-1'>
                <div>
                  <dt className='text-muted-foreground'>IP ID</dt>
                  <dd className='break-all'>{batch.ipId}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Constellation Tx</dt>
                  <dd className='break-all'>{batch.constellationTx}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Evidence Hash</dt>
                  <dd className='break-all'>{batch.evidenceHash}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Timestamp</dt>
                  <dd>{formatDate(batch.createdAt)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
