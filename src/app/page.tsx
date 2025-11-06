import Link from 'next/link'

import {
  ArrowRight,
  Bitcoin,
  CheckCircle2,
  Coins,
  FileBadge2,
  Globe,
  Lock,
  Shield,
  Sparkles,
  Zap
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

const stats = [
  { label: 'Blockchain Integration', value: '3+' },
  { label: 'Instant Settlements', value: '<1min' },
  { label: 'Compliance Ready', value: '100%' },
  { label: 'Uptime', value: '99.9%' }
]

const features = [
  {
    title: 'Provenance-Grade Receipts',
    description:
      'Every sale generates C2PA bundles, verifiable credentials, and Constellation hashes that anyone can verify instantly.',
    icon: FileBadge2,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Smart Compatibility Checks',
    description:
      'Automatically inspects upstream PIL terms before registering derivatives, preventing unenforceable licensing chains.',
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'One-Click Licensing',
    description:
      'Single checkout link captures wallets, handles ckBTC payment, and mints Story license tokens automatically.',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Revenue Optimization',
    description:
      'Configure minting fees, royalty splits, and UMA dispute bonds in one console with automated creator payouts.',
    icon: Coins,
    color: 'from-amber-500 to-orange-500'
  },
  {
    title: 'Instant ckBTC Settlement',
    description:
      'Lightning-fast ckBTC escrow with real-time monitoring and automatic finalization for seamless transactions.',
    icon: Bitcoin,
    color: 'from-yellow-500 to-amber-500'
  },
  {
    title: 'Decentralized Identity',
    description:
      'Internet Identity integration provides secure, privacy-preserving authentication without passwords.',
    icon: Shield,
    color: 'from-indigo-500 to-purple-500'
  }
]

const techStack = [
  {
    name: 'Story Protocol',
    description: 'Programmable IP licensing on-chain',
    icon: Globe
  },
  {
    name: 'ICP Blockchain',
    description: 'Chain-Key Bitcoin (ckBTC) & Internet Identity',
    icon: Lock
  },
  {
    name: 'Constellation',
    description: 'Immutable proof of provenance',
    icon: Sparkles
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Register Your IP',
    description:
      'Upload assets, generate DDEX metadata, attach PIL terms with automatic derivative compatibility validation.',
    icon: FileBadge2
  },
  {
    step: '02',
    title: 'Share Checkout Link',
    description:
      'Buyers authenticate via Internet Identity, connect wallets, and pay with ckBTC in real-time.',
    icon: Bitcoin
  },
  {
    step: '03',
    title: 'Automated Settlement',
    description:
      'Story license tokens mint automatically, evidence archives to IPFS, Constellation anchors proofs instantly.',
    icon: Zap
  },
  {
    step: '04',
    title: 'Community Protection',
    description:
      'Public dispute reporting with UMA arbitration and Constellation evidence ensures catalog integrity.',
    icon: Shield
  }
]

const painPoints = [
  {
    problem: 'Rights metadata gaps stall royalty payouts and audits.',
    sourceLabel: 'The MLC Data Quality Initiative',
    sourceUrl: 'https://www.themlc.com/dataprograms',
    solution:
      'LexLink captures creator splits, addresses, and DDEX descriptors on every registration with Convex mirroring.'
  },
  {
    problem: 'Teams need trustworthy chain of custody for digital works.',
    sourceLabel: 'C2PA · Content Provenance & Authenticity',
    sourceUrl: 'https://c2pa.org/about/',
    solution:
      'Every settlement produces downloadable C2PA archives, verifiable credentials, and Constellation receipts.'
  },
  {
    problem: 'Manual licensing flows depend on emails, PDFs, and invoices.',
    sourceLabel: 'U.S. Copyright Office · Music Marketplace Study',
    sourceUrl:
      'https://copyright.gov/docs/musiclicensingstudy/copyright-and-the-music-marketplace.pdf',
    solution:
      'Single checkout URL collapses outreach, invoicing, settlement, minting, and evidence generation.'
  }
]

const references = [
  {
    label: 'Story Protocol — Programmable IP License (PIL)',
    href: 'https://docs.story.foundation/concepts/programmable-ip-license/overview'
  },
  {
    label: 'C2PA — Technical Specifications (Content Credentials)',
    href: 'https://c2pa.org/specifications/specifications/2.2/index.html'
  },
  {
    label: 'ICP — ckBTC (Chain-Key Bitcoin) Overview',
    href: 'https://internetcomputer.org/docs/defi/chain-key-tokens/ckbtc/overview'
  },
  {
    label: 'Internet Identity — Technical Specification',
    href: 'https://internetcomputer.org/docs/references/ii-spec'
  },
  {
    label: 'UMA — How the Optimistic Oracle Works',
    href: 'https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work'
  }
];

export default function HomePage() {
  return (
    <div className='relative overflow-hidden'>
      {/* Gradient Background */}
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute -top-1/2 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-3xl' />
        <div className='absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl' />
        <div className='absolute -bottom-1/2 left-1/2 h-[700px] w-[700px] rounded-full bg-cyan-500/20 blur-3xl' />
      </div>

      <div className='container-edge'>
        <div className='flex flex-col gap-32 py-16'>
          {/* Hero Section */}
          <section className='relative'>
            <div className='mx-auto flex max-w-6xl flex-col items-center gap-12 text-center'>
              <div className='flex flex-col items-center gap-6'>
                <Badge
                  variant='outline'
                  className='border-primary/30 bg-primary/5 px-5 py-2 text-sm font-semibold backdrop-blur-sm'
                >
                  <Sparkles className='mr-2 h-4 w-4' />
                  Powered by Story Protocol & ICP
                </Badge>

                <h1 className='max-w-5xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl'>
                  Pay with{' '}
                  <span className='bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent'>
                    Bitcoin
                  </span>
                  .
                  <br />
                  Get licensed{' '}
                  <span className='bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
                    instantly
                  </span>
                  .
                </h1>

                <p className='max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl'>
                  The first decentralized IP licensing platform that combines{' '}
                  <span className='font-semibold text-foreground'>
                    Story Protocol
                  </span>
                  ,{' '}
                  <span className='font-semibold text-foreground'>
                    ckBTC settlement
                  </span>
                  , and{' '}
                  <span className='font-semibold text-foreground'>
                    Constellation evidence
                  </span>{' '}
                  into one seamless checkout experience.
                </p>
              </div>

              <div className='flex flex-wrap items-center justify-center gap-4'>
                <Button
                  size='lg'
                  asChild
                  className='group h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30'
                >
                  <Link href='/dashboard'>
                    Launch Console
                    <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                  </Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  asChild
                  className='h-14 border-2 px-8 text-base font-semibold transition-all hover:scale-105'
                >
                  <Link href='/gallery'>Browse Gallery</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className='grid w-full max-w-4xl grid-cols-2 gap-6 pt-8 md:grid-cols-4'>
                {stats.map(stat => (
                  <div
                    key={stat.label}
                    className='group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80'
                  >
                    <div className='text-3xl font-bold text-primary md:text-4xl'>
                      {stat.value}
                    </div>
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className='relative'>
            <div className='mb-16 text-center'>
              <Badge
                variant='outline'
                className='mb-4 border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide'
              >
                Powered By Industry Leaders
              </Badge>
              <h2 className='mb-4 text-3xl font-bold md:text-4xl lg:text-5xl'>
                Built on the{' '}
                <span className='bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'>
                  Future
                </span>{' '}
                of Web3
              </h2>
              <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
                Seamlessly integrating cutting-edge blockchain technologies for
                unstoppable IP licensing
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-3'>
              {techStack.map(tech => {
                const Icon = tech.icon
                return (
                  <Card
                    key={tech.name}
                    className='group relative overflow-hidden border-border/60 bg-gradient-to-b from-card via-card/80 to-card/50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl'
                  >
                    <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                    <CardHeader className='relative space-y-4'>
                      <div className='inline-flex rounded-2xl border border-primary/20 bg-primary/10 p-4 transition-all group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/20'>
                        <Icon className='h-8 w-8 text-primary' />
                      </div>
                      <CardTitle className='text-2xl font-bold'>
                        {tech.name}
                      </CardTitle>
                      <CardDescription className='text-base leading-relaxed'>
                        {tech.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Features Section */}
          <section className='relative'>
            <div className='mb-16 text-center'>
              <Badge
                variant='outline'
                className='mb-4 border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide'
              >
                Why Choose LexLink
              </Badge>
              <h2 className='mb-4 text-3xl font-bold md:text-4xl lg:text-5xl'>
                Enterprise-Grade Features
              </h2>
              <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
                Everything you need to license, settle, and protect your
                intellectual property at scale
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={feature.title}
                    className='group relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/50 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl'
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                    <CardHeader className='relative space-y-4'>
                      <div
                        className={`inline-flex w-fit rounded-xl bg-gradient-to-br ${feature.color} p-3 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-xl`}
                      >
                        <Icon className='h-6 w-6 text-white' />
                      </div>
                      <CardTitle className='text-xl font-bold'>
                        {feature.title}
                      </CardTitle>
                      <CardDescription className='leading-relaxed'>
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* How It Works */}
          <section className='relative'>
            <div className='mb-16 text-center'>
              <Badge
                variant='outline'
                className='mb-4 border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide'
              >
                Simple Process
              </Badge>
              <h2 className='mb-4 text-3xl font-bold md:text-4xl lg:text-5xl'>
                How LexLink Works
              </h2>
              <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
                Four simple steps to automated IP licensing with blockchain
                verification
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
              {howItWorks.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.step} className='relative'>
                    {/* Connection Line */}
                    {index < howItWorks.length - 1 && (
                      <div className='absolute left-1/2 top-16 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent lg:block' />
                    )}

                    <Card className='group relative h-full border-border/60 bg-gradient-to-b from-card to-card/50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl'>
                      <CardHeader className='space-y-4'>
                        <div className='flex items-center gap-4'>
                          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-xl font-bold text-primary-foreground shadow-lg'>
                            {step.step}
                          </div>
                          <div
                            className={`rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 transition-all group-hover:scale-110`}
                          >
                            <Icon className='h-6 w-6 text-primary' />
                          </div>
                        </div>
                        <CardTitle className='text-xl font-bold'>
                          {step.title}
                        </CardTitle>
                        <CardDescription className='leading-relaxed'>
                          {step.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Problems We Solve */}
          <section className='relative rounded-3xl border border-border/40 bg-gradient-to-b from-muted/30 to-muted/10 p-10 backdrop-blur-sm md:p-16'>
            <div className='mb-16 text-center'>
              <Badge
                variant='outline'
                className='mb-4 border-primary/30 bg-background/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm'
              >
                Real-World Solutions
              </Badge>
              <h2 className='mb-4 text-3xl font-bold md:text-4xl lg:text-5xl'>
                Industry Challenges We Solve
              </h2>
              <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
                Every claim backed by authoritative sources for your compliance
                documentation
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2'>
              {painPoints.map((item, index) => (
                <Card
                  key={item.problem}
                  className='group border-border/60 bg-background/80 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl'
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <CardHeader className='space-y-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-shrink-0 rounded-lg bg-destructive/10 p-2'>
                        <div className='h-2 w-2 rounded-full bg-destructive' />
                      </div>
                      <CardTitle className='flex-1 text-lg leading-snug'>
                        {item.problem}
                      </CardTitle>
                    </div>
                    <Link
                      href={item.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline'
                    >
                      <span>Source: {item.sourceLabel}</span>
                      <ArrowRight className='h-3.5 w-3.5' />
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4'>
                      <CheckCircle2 className='h-5 w-5 flex-shrink-0 text-emerald-500' />
                      <p className='text-sm leading-relaxed text-foreground'>
                        {item.solution}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* References & CTA */}
          <section className='grid gap-8 lg:grid-cols-[1fr_1.3fr]'>
            <Card className='h-fit border-border/60 bg-gradient-to-br from-card to-card/50 shadow-xl'>
              <CardHeader>
                <CardTitle className='text-2xl font-bold'>
                  Standards & Documentation
                </CardTitle>
                <CardDescription className='text-base leading-relaxed'>
                  Explore the ecosystems powering LexLink's automation
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {references.map(link => (
                  <Button
                    key={link.label}
                    variant='outline'
                    asChild
                    className='group h-auto w-full justify-between border-border/60 py-4 text-left transition-all hover:border-primary/30 hover:bg-accent/50'
                  >
                    <Link href={link.href} target='_blank' rel='noreferrer'>
                      <span className='text-sm font-medium'>{link.label}</span>
                      <ArrowRight className='h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1' />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className='border-border/60 bg-gradient-to-br from-primary/5 via-card to-card/50 shadow-xl'>
              <CardHeader className='space-y-6'>
                <div>
                  <CardTitle className='mb-4 text-3xl font-bold lg:text-4xl'>
                    Ready to Transform Your IP Licensing?
                  </CardTitle>
                  <CardDescription className='text-base leading-relaxed lg:text-lg'>
                    Join the future of decentralized intellectual property
                    management. Launch your licensing infrastructure in
                    minutes, not months.
                  </CardDescription>
                </div>

                <div className='flex flex-col gap-4 pt-4'>
                  <Button
                    size='lg'
                    asChild
                    className='group h-14 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30'
                  >
                    <Link href='/dashboard'>
                      Get Started Now
                      <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                    </Link>
                  </Button>
                  <Button
                    size='lg'
                    variant='outline'
                    asChild
                    className='h-14 border-2 text-base font-semibold transition-all hover:scale-105'
                  >
                    <Link href='/gallery'>Explore Gallery</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4 rounded-2xl border border-border/40 bg-background/50 p-6 backdrop-blur-sm'>
                  <div>
                    <div className='text-2xl font-bold text-primary'>
                      Instant
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Settlement
                    </div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-primary'>100%</div>
                    <div className='text-sm text-muted-foreground'>
                      Automated
                    </div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-primary'>24/7</div>
                    <div className='text-sm text-muted-foreground'>
                      Available
                    </div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-primary'>
                      Secure
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      On-Chain
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
