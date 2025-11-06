import Link from 'next/link'

import {
  ArrowRight,
  CheckCircle2,
  FileBadge2,
  ShieldCheck,
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
    title: 'Click-to-license checkout',
    description:
      'One link captures the buyer’s wallet, handles ckBTC or BTC payment, and mints the Story license token automatically.',
    icon: Sparkles
  },
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
      'Operators record training batches inside LexLink; the ledger emits Constellation proofs and shareable receipts at /verify/training.'
  },
  {
    problem: 'Licensing flows still depend on emails, PDFs, and manual invoices.',
    sourceLabel:
      'U.S. Copyright Office · Music Marketplace Study (2015)',
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
      'Operators escalate contested uses directly from the dashboard; UMA handles liveness and Constellation stores the evidence payload.'
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
    <div className='flex flex-col gap-16'>
      <section className='overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-white shadow-xl md:p-16'>
        <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
          <Badge variant='outline' className='border-white/30 bg-white/10 text-white'>
            Instant, provable licensing
          </Badge>
          <h1 className='text-4xl font-semibold tracking-tight md:text-6xl'>
            Pay with Bitcoin. Get a license, evidence bundle, and training ledger proof—automatically.
          </h1>
          <p className='text-lg text-slate-300 md:text-xl'>
            LexLink blends Story Protocol, ckBTC escrow, Constellation evidence, and Internet Identity into a single checkout so creative and AI teams can transact without paperwork.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <Button
              size='lg'
              asChild
              className='bg-white text-slate-900 hover:bg-slate-200'
            >
              <Link href='/dashboard'>Launch the console</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className='grid gap-6 md:grid-cols-3'>
        {valueProps.map(value => {
          const Icon = value.icon
          return (
            <Card
              key={value.title}
              className='h-full border-border/60 bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
            >
              <CardHeader className='flex flex-row items-center gap-3'>
                <div className='rounded-full border border-primary/40 bg-primary/10 p-2 text-primary'>
                  <Icon className='h-5 w-5' />
                </div>
                <CardTitle className='text-lg font-semibold'>
                  {value.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{value.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className='space-y-6 rounded-3xl border border-border/60 bg-muted/20 p-8'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-semibold'>Real problems we address</h2>
          <p className='text-sm text-muted-foreground'>
            Use these callouts on your landing page or pitch deck—the source links back every statement.
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          {painPoints.map(item => (
            <Card key={item.problem} className='border-border/60 bg-card/60 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-base'>{item.problem}</CardTitle>
                <CardDescription>
                  <Link
                    href={item.sourceUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary underline-offset-4 hover:underline'
                  >
                    Source: {item.sourceLabel}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-foreground'>{item.lexlink}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='grid gap-6 rounded-3xl border border-border/60 bg-muted/20 p-8 md:grid-cols-[1.05fr_1fr]'>
        <div className='space-y-5'>
          <h2 className='text-2xl font-semibold'>How LexLink works</h2>
          <p className='text-sm text-muted-foreground'>
            Each step orchestrates Story Protocol, ICP Bitcoin tooling, and Constellation from a single Next.js console.
          </p>
          <ul className='space-y-4'>
            {howItWorks.map(step => (
              <li
                key={step.title}
                className='rounded-xl border border-dashed border-border/60 bg-background/80 p-4'
              >
                <p className='text-sm font-medium flex items-center gap-2'>
                  <ShieldCheck className='h-4 w-4 text-primary' />
                  {step.title}
                </p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {step.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <Card className='border-border/60 bg-card/60 shadow-md'>
          <CardHeader>
            <CardTitle>Standards & documentation</CardTitle>
            <CardDescription>
              Stay aligned with the ecosystems LexLink automates against.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3'>
            {referenceLinks.map(link => (
              <Button
                key={link.label}
                variant='outline'
                asChild
                className='justify-between'
              >
                <Link href={link.href} target='_blank' rel='noreferrer'>
                  {link.label}
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
