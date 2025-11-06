import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='container-edge'>
      <div className='flex flex-col gap-8 py-12'>
        <div className='space-y-4'>
          <Skeleton className='h-12 w-64' />
          <Skeleton className='h-6 w-96' />
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='border-border/60'>
              <CardHeader>
                <Skeleton className='h-12 w-12 rounded-full' />
                <Skeleton className='h-6 w-32' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-20 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className='border-border/60'>
              <CardHeader>
                <Skeleton className='h-6 w-48' />
                <Skeleton className='h-4 w-64' />
              </CardHeader>
              <CardContent className='space-y-3'>
                <Skeleton className='h-24 w-full' />
                <Skeleton className='h-24 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
