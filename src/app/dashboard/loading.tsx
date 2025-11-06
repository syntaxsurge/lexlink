import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
      </div>

      <div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='border-border/60'>
            <CardHeader>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-24' />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='border-border/60'>
            <CardHeader>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-64' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-32 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
