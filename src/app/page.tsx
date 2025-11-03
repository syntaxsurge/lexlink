import Link from 'next/link'

import { Button } from '@/components/ui/button'

const highlights = [
  {
    title: 'Story-native licensing',
    description:
      'Creators register IP assets and attach PIL-compliant terms in one flow, ready for downstream royalty automation.'
  },
  {
    title: 'Bitcoin escrow on ICP',
    description:
      'Buyers pay in Bitcoin via an Internet Computer canister that issues signed payment attestations.'
  },
  {
    title: 'Constellation evidence trail',
    description:
      'Every license and dispute is sealed to IntegrationNet so auditors can verify the complete compliance history.'
  }
]

export default function HomePage() {
  return (
    <div className='flex flex-col gap-16'>
      <section className='space-y-6 text-center'>
        <span className='text-sm font-medium uppercase tracking-wider text-primary'>
          Legaltech for the on-chain era
        </span>
        <h1 className='text-4xl font-bold md:text-6xl'>
          License IP, settle in Bitcoin, prove it everywhere.
        </h1>
        <p className='mx-auto max-w-3xl text-lg text-muted-foreground'>
          LexLink unifies Story Protocol licensing, ICP-based Bitcoin escrow,
          and Constellation evidence to help creators monetize responsibly while
          regulators get real-time transparency.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button size='lg' asChild>
            <Link href='/app'>Open the Console</Link>
          </Button>
          <Button size='lg' variant='secondary' asChild>
            <Link href='/playbook'>Read the playbook</Link>
          </Button>
        </div>
      </section>

      <section className='grid gap-8 md:grid-cols-3'>
        {highlights.map(highlight => (
          <article
            key={highlight.title}
            className='rounded-xl border bg-card p-6 text-left shadow-sm'
          >
            <h2 className='text-xl font-semibold'>{highlight.title}</h2>
            <p className='mt-3 text-sm text-muted-foreground'>
              {highlight.description}
            </p>
          </article>
        ))}
      </section>

      <section className='rounded-2xl border bg-muted/30 p-8 text-center'>
        <h2 className='text-2xl font-semibold'>
          Building for Story, ICP, and Constellation
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Follow our build log for the LexLink hackathon submission and try the
          free testnet sandbox for yourself.
        </p>
        <div className='mt-4 flex flex-wrap justify-center gap-3'>
          <Button variant='ghost' asChild>
            <Link href='https://docs.story.foundation' target='_blank'>
              Story Protocol Docs
            </Link>
          </Button>
          <Button variant='ghost' asChild>
            <Link
              href='https://internetcomputer.org/docs/current/references/bitcoin-integration'
              target='_blank'
            >
              ICP Bitcoin Guide
            </Link>
          </Button>
          <Button variant='ghost' asChild>
            <Link href='https://docs.constellationnetwork.io' target='_blank'>
              Constellation Fundamentals
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
