import Link from 'next/link'

import {
  ArrowRight,
  CheckCircle2,
  Coins,
  FileBadge2,
  Sparkles
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const valueProps = [
  {
    title: 'Provenance-grade receipts',
    description:
      'Each sale publishes a C2PA bundle, verifiable credential, and Constellation hash that anyone can verify at /verify.',
    icon: FileBadge2
  },
  {
    title: 'Compatibility guardrails',
    description:
      'LexLink inspects upstream PIL terms before registering derivatives, preventing licensing chains that can’t be enforced.',
    icon: CheckCircle2
  },
  {
    title: 'Click-to-license checkout',
    description:
      'One link captures the buyer’s wallet, handles ckBTC or BTC payment, and mints the Story license token automatically.',
    icon: Sparkles
  },
  {
    title: 'Revenue levers baked in',
    description:
      'Configure minting fees, royalty splits, and UMA dispute bonds in one console so every sale and upheld claim routes value back to creators.',
    icon: Coins
  }
]

const painPoints = [
  {
    problem: 'Rights metadata gaps stall royalty payouts and audits.',
    sourceLabel: 'The MLC Data Quality Initiative',
    sourceUrl: 'https://www.themlc.com/dataprograms',
    lexlink:
      'LexLink captures creator splits, addresses, and DDEX-ready descriptors on every registration, then mirrors them in Convex for downstream partners.'
  },
  {
    problem: 'Teams need a trustworthy chain of custody for digital works.',
    sourceLabel: 'C2PA · Content Provenance & Authenticity',
    sourceUrl: 'https://c2pa.org/about/',
    lexlink:
      'Every settlement produces a downloadable C2PA archive, verifiable credential, and Constellation receipt so provenance checks take seconds.'
  },
  {
    problem: 'AI regulations expect disclosures about licensed training data.',
    sourceLabel: 'EU AI Act transparency obligations',
    sourceUrl:
      'https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence',
    lexlink:
      'LexLink tracks licensed training batches and publishes Constellation-backed receipts at /verify/training.'
  },
  {
    problem:
      'Licensing flows still depend on emails, PDFs, and manual invoices.',
    sourceLabel: 'U.S. Copyright Office · Music Marketplace Study (2015)',
    sourceUrl:
      'https://copyright.gov/docs/musiclicensingstudy/copyright-and-the-music-marketplace.pdf',
    lexlink:
      'LexLink collapses outreach, invoicing, ckBTC/BTC settlement, Story minting, and evidence generation into a single checkout URL.'
  },
  {
    problem: 'Disputes need neutral, on-chain resolution rails.',
    sourceLabel: 'UMA Optimistic Oracle documentation',
    sourceUrl: 'https://docs.uma.xyz/developers/optimistic-oracle',
    lexlink:
      'Reporters flag assets from /report, operators triage the disputes inbox, and UMA enforces liveness while Constellation stores the evidence payload.'
  }
]

const howItWorks = [
  {
    title: 'Register once',
    detail:
      'Upload the asset, hash the binaries, auto-generate DDEX-friendly metadata, and attach PIL-compliant license terms with derivative compatibility checks.'
  },
  {
    title: 'Share the checkout link',
    detail:
      'Buyers authenticate with Internet Identity, choose their wallet, and pay in ckBTC or BTC while the console watches the escrow in real time.'
  },
  {
    title: 'Collect the proof',
    detail:
      'LexLink mints the Story license token, archives the evidence, anchors Constellation hashes, and exposes downloadable receipts under /verify.'
  },
  {
    title: 'Protect your catalog',
    detail:
      'Share the public /report link so the community flags issues; review disputes in the dashboard, simulate UMA decisions on testnet, and unblock assets after resolution.'
  }
]

const referenceLinks = [
  {
    label: 'Story Protocol PIL docs',
    href: 'https://docs.story.foundation/docs/programmable-ip-license'
  },
  {
    label: 'C2PA provenance standard',
    href: 'https://c2pa.org/about/'
  },
  {
    label: 'ckBTC (Chain-Key Bitcoin) overview',
    href: 'https://internetcomputer.org/docs/current/developer-docs/multi-chain/bitcoin/ckbtc-intro'
  },
  {
    label: 'Internet Identity architecture',
    href: 'https://internetcomputer.org/docs/current/concepts/identity/internet-identity/'
  },
  {
    label: 'UMA Optimistic Oracle',
    href: 'https://docs.uma.xyz/developers/optimistic-oracle'
  }
]

export default function HomePage() {
  return (
    <div className='container-edge'>
      <div className='flex flex-col gap-24 py-12'>
        <section className='relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-12 text-white shadow-2xl md:p-20'>
          <div className='bg-grid-white/5 absolute inset-0' />
          <div className='relative mx-auto flex max-w-5xl flex-col items-center gap-8 text-center'>
            <Badge
              variant='outline'
              className='border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm'
            >
              Instant, provable licensing
            </Badge>
            <h1 className='text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl'>
              Pay with Bitcoin.
              <br />
              <span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                Get licensed instantly.
              </span>
            </h1>
            <p className='max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl'>
              LexLink blends Story Protocol, ckBTC escrow, Constellation
              evidence, and Internet Identity into a single checkout so creative
              and AI teams can transact without paperwork.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-4 pt-4'>
              <Button
                size='lg'
                asChild
                className='h-12 bg-white px-8 text-base font-medium text-slate-900 shadow-lg transition-all hover:scale-105 hover:bg-slate-100'
              >
                <Link href='/dashboard'>Launch the console</Link>
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='h-12 border-white/30 bg-white/10 px-8 text-base font-medium text-white backdrop-blur-sm hover:bg-white/20'
              >
                <Link href='/gallery'>Browse gallery</Link>
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className='mb-10 text-center'>
            <h2 className='mb-3 text-3xl font-bold md:text-4xl'>
              Why teams choose LexLink
            </h2>
            <p className='mx-auto max-w-2xl text-muted-foreground'>
              Build trust with automated compliance and instant settlements
            </p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {valueProps.map(value => {
              const Icon = value.icon
              return (
                <Card
                  key={value.title}
                  className='group h-full border-border/60 bg-gradient-to-b from-card to-card/50 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg'
                >
                  <CardHeader>
                    <div className='mb-4 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary transition-all group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/20'>
                      <Icon className='h-6 w-6' />
                    </div>
                    <CardTitle className='text-xl'>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className='leading-relaxed'>
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className='rounded-3xl border border-border/40 bg-muted/30 p-10 backdrop-blur-sm md:p-12'>
          <div className='mb-10 space-y-3 text-center'>
            <h2 className='text-3xl font-bold md:text-4xl'>
              Industry challenges we solve
            </h2>
            <p className='mx-auto max-w-2xl text-muted-foreground'>
              Every claim is backed by authoritative sources. Use these for your
              pitch deck or compliance documentation.
            </p>
          </div>
          <div className='grid gap-6 md:grid-cols-2'>
            {painPoints.map(item => (
              <Card
                key={item.problem}
                className='border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md'
              >
                <CardHeader className='space-y-3'>
                  <CardTitle className='text-lg leading-snug'>
                    {item.problem}
                  </CardTitle>
                  <CardDescription>
                    <Link
                      href={item.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline'
                    >
                      <span>Source: {item.sourceLabel}</span>
                      <ArrowRight className='h-3 w-3' />
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {item.lexlink}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className='grid gap-8 lg:grid-cols-[1.2fr_1fr]'>
          <div className='space-y-6'>
            <div className='space-y-3'>
              <h2 className='text-3xl font-bold md:text-4xl'>How it works</h2>
              <p className='text-muted-foreground'>
                Each step orchestrates Story Protocol, ICP Bitcoin tooling, and
                Constellation from a single Next.js console.
              </p>
            </div>
            <div className='space-y-4'>
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className='group relative rounded-2xl border border-border/60 bg-card/50 p-5 shadow-sm transition-all hover:border-primary/20 hover:bg-card/80 hover:shadow-md'
                >
                  <div className='mb-2 flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/20'>
                      {index + 1}
                    </div>
                    <p className='font-semibold text-foreground'>
                      {step.title}
                    </p>
                  </div>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className='h-fit border-border/60 bg-gradient-to-b from-card to-card/50 shadow-md'>
            <CardHeader>
              <CardTitle className='text-2xl'>
                Standards & documentation
              </CardTitle>
              <CardDescription className='leading-relaxed'>
                Stay aligned with the ecosystems LexLink automates against.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {referenceLinks.map(link => (
                <Button
                  key={link.label}
                  variant='outline'
                  asChild
                  className='h-auto w-full justify-between py-3 text-left transition-all hover:bg-accent/50'
                >
                  <Link href={link.href} target='_blank' rel='noreferrer'>
                    <span className='text-sm'>{link.label}</span>
                    <ArrowRight className='h-4 w-4 flex-shrink-0' />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
