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
  const { ips, licenses, disputes } = await loadDashboardData()
  const awaitingOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'awaiting_payment'
  )
  const completedOrders = licenses.filter(
    (license: LicenseRecord) => license.status === 'completed'
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
                <th className='px-4 py-2 text-left font-medium'>Created</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border bg-card'>
              {ips.length === 0 && (
                <tr>
                  <td
                    className='px-4 py-6 text-center text-muted-foreground'
                    colSpan={6}
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
            {completedOrders.map((order: LicenseRecord) => (
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
                    <dt className='text-muted-foreground'>Attestation Hash</dt>
                    <dd className='break-all'>{order.attestationHash}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Constellation Tx</dt>
                    <dd className='break-all'>{order.constellationTx}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Token ID</dt>
                    <dd className='break-all'>{order.tokenOnChainId}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
