import Link from 'next/link'

import { ArrowRight, ShieldCheck, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const featureCards = [
  {
    title: 'Story-native licensing',
    description:
      'Register IP once, attach PIL-compliant terms, and let the Story Protocol SDK mirror licensing outcomes for downstream automation.',
    icon: ShieldCheck
  },
  {
    title: 'ICP escrow with ckBTC practices',
    description:
      'Borrowing Splitsafe’s ckBTC playbook, LexLink issues deposit addresses, validates attestations, and keeps full audit trails in Convex.',
    icon: Wallet
  },
  {
    title: 'Constellation evidence trail',
    description:
      'Publish hash proofs to IntegrationNet so compliance teams and counterparties can interrogate every settlement in seconds.',
    icon: ArrowRight
  }
]

const workflow = [
  {
    title: 'Register IP assets',
    detail:
      'Upload metadata, hash the creative files, and mint the IP on Story Protocol. LexLink mirrors the record in Convex for fast lookups.'
  },
  {
    title: 'Generate Bitcoin invoices',
    detail:
      'Our ICP escrow canister derives fresh P2WPKH addresses. Buyers remit BTC, the canister responds with signed ckBTC-style attestations.'
  },
  {
    title: 'Finalize and evidence',
    detail:
      'Mint the Story license token to the buyer, archive the asset with C2PA manifests, and anchor the compliance hash to Constellation.'
  }
]

export default function HomePage() {
  return (
    <div className='flex flex-col gap-16'>
      <section className='overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-white shadow-xl md:p-16'>
        <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
          <Badge variant='outline' className='border-white/40 bg-white/10 text-white'>
            Coordinated IP commerce
          </Badge>
          <h1 className='text-4xl font-semibold tracking-tight md:text-6xl'>
            Story Protocol IP, ICP Bitcoin escrow, and Constellation evidence in one console.
          </h1>
          <p className='text-lg text-slate-300 md:text-xl'>
            LexLink fuses the high-signal practices from Proofly’s Internet Identity flow and Splitsafe’s ckBTC settlement model so teams can operate with confidence and regulators get verifiable telemetry.
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <Button size='lg' asChild className='bg-white text-slate-900 hover:bg-slate-200'>
              <Link href='/app'>Launch the console</Link>
            </Button>
            <Button size='lg' variant='secondary' asChild className='border-white/40 text-white hover:bg-white/10'>
              <Link href='/playbook'>Playbook reference</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className='grid gap-6 md:grid-cols-3'>
        {featureCards.map(feature => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className='h-full border-border/60 bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
              <CardHeader className='flex flex-row items-center gap-3'>
                <div className='rounded-full border border-primary/40 bg-primary/10 p-2 text-primary'>
                  <Icon className='h-5 w-5' />
                </div>
                <CardTitle className='text-lg font-semibold'>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className='grid gap-6 rounded-3xl border border-border/60 bg-muted/20 p-8 md:grid-cols-[1.1fr_1fr]'>
        <div className='space-y-5'>
          <h2 className='text-2xl font-semibold'>Three-step operator workflow</h2>
          <p className='text-sm text-muted-foreground'>
            Each step maps to a server action that orchestrates Story, ICP, and Constellation calls. We reused Splitsafe&apos;s ckBTC validation playbook to harden payment checks and Proofly&apos;s delegation guardrails for Internet Identity.
          </p>
          <ul className='space-y-4'>
            {workflow.map(step => (
              <li key={step.title} className='rounded-xl border border-dashed border-border/60 bg-background/80 p-4'>
                <p className='text-sm font-medium'>{step.title}</p>
                <p className='mt-1 text-sm text-muted-foreground'>{step.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <Card className='border-border/60 bg-card/60 shadow-md'>
          <CardHeader>
            <CardTitle>Integration quick links</CardTitle>
            <CardDescription>
              Stay aligned with the canonical docs for each network LexLink touches.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <Button variant='outline' asChild className='justify-between'>
              <Link href='https://docs.story.foundation' target='_blank'>
                Story Protocol SDK
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button variant='outline' asChild className='justify-between'>
              <Link
                href='https://internetcomputer.org/docs/current/references/bitcoin-integration'
                target='_blank'
              >
                ICP Bitcoin Toolkit
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button variant='outline' asChild className='justify-between'>
              <Link href='https://docs.constellationnetwork.io' target='_blank'>
                Constellation IntegrationNet
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
