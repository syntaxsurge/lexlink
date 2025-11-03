import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className='border-b bg-background/80 backdrop-blur'>
      <div className='container-edge flex items-center justify-between gap-4 py-4'>
        <Link href='/' className='text-lg font-semibold'>
          LexLink
        </Link>
        <nav className='flex items-center gap-2'>
          <Button asChild variant='ghost'>
            <Link href='/playbook'>Playbook</Link>
          </Button>
          <Button asChild>
            <Link href='/app'>Launch Console</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
