import Link from 'next/link'

import { loadDashboardData, type IpRecord } from '@/app/dashboard/actions'
import { RegisterIpForm } from '@/components/app/register-ip-form'
import { Badge } from '@/components/ui/badge'
import { IpAssetCard } from '@/components/app/ip-asset-card'
import { env } from '@/lib/env'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type StoryNetwork } from '@/lib/story-links'

export default async function IpRegistryPage() {
  const { ips } = await loadDashboardData()

  return (
    <div className='space-y-10'>
      <div className='grid gap-6 xl:grid-cols-[1.3fr_1fr]'>
        <Card className='border-border/70 bg-card/70 shadow-md'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold text-foreground'>
              Register Story IP Asset
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Mint an SPG NFT, attach programmable PIL terms, and mirror the asset into Convex with creator splits, royalties, and AI provenance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterIpForm />
          </CardContent>
        </Card>

        <Card className='border-border/70 bg-card/70 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold text-foreground'>
              Catalogue snapshot
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Updated whenever a registration completes. These figures sync with the public gallery and marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <MetricCard
              label='Total registered assets'
              value={ips.length.toString()}
              helper='Story Protocol IPAs mirrored locally'
            />
            <Separator />
            <div className='space-y-3 text-sm text-muted-foreground'>
              <p>
                Each IP includes creator credits, royalty splits, and metadata bundles ready for marketplaces and compliance workflows.
              </p>
              <p>
                Every registration also forwards the asset to LexLink&apos;s public gallery so prospective buyers can preview media before requesting an invoice.
              </p>
            </div>
            <Link
              href='https://docs.storyprotocol.xyz/docs/spg'
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline'
            >
              Story Protocol SPG documentation →
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
              Registered IP assets
            </h2>
            <p className='text-sm text-muted-foreground'>
              All Story Protocol registrations owned by this account, ready for licensing, marketplace listing, and AI genealogy.
            </p>
          </div>
          <Badge variant='outline' className='border-primary/40 text-primary'>
            {ips.length} listed
          </Badge>
        </div>
        {ips.length > 0 ? (
          <div className='grid gap-6 lg:grid-cols-2 2xl:grid-cols-3'>
            {ips.map(ip => (
              <IpAssetCard
                key={ip.ipId}
                asset={ip}
                network={(env.NEXT_PUBLIC_STORY_NETWORK as StoryNetwork) ?? 'aeneid'}
                highlightActions
                actionSlot={
                  <div className='space-y-2 text-xs text-muted-foreground'>
                    <p className='font-semibold text-foreground'>Next steps</p>
                    <p>
                      Generate a ckBTC or BTC invoice from Licenses → Create order to start selling this asset with the configured royalties.
                    </p>
                    <Link
                      href={`/report?ipId=${ip.ipId}`}
                      className='inline-flex items-center text-primary underline-offset-4 hover:underline'
                    >
                      Share public report link →
                    </Link>
                    <Link
                      href={`/dashboard/licenses?ip=${ip.ipId}`}
                      className='inline-flex items-center text-primary underline-offset-4 hover:underline'
                    >
                      Create license order →
                    </Link>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <Card className='border-dashed border-border/60 bg-muted/20 py-20 text-center'>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                No IP assets registered yet. Use the form above to mint your first Story asset and expose it to buyers instantly.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  helper: string
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className='rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm'>
      <p className='text-xs uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <p className='mt-2 text-3xl font-semibold text-foreground'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{helper}</p>
    </div>
  )
}
