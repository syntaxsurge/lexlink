'use client'

import NextTopLoader from 'nextjs-toploader'

export function TopNavigationLoader() {
  return (
    <NextTopLoader
      color='hsl(var(--primary))'
      crawl
      height={3}
      showSpinner={false}
      shadow='0 0 12px hsl(var(--primary) / 0.4)'
      easing='ease'
      speed={300}
      crawlSpeed={300}
      zIndex={1600}
    />
  )
}
