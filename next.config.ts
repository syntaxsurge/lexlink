import path from 'node:path'

import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), usb=(), payment=(), accelerometer=(), autoplay=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=15552000; includeSubDomains'
  }
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/demo-video',
        destination:
          process.env.DEMO_VIDEO_URL ||
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false
      },
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false
      },
      {
        source: '/app/:path*',
        destination: '/dashboard/:path*',
        permanent: false
      }
    ]
  },
  serverExternalPackages: ['@stardust-collective/dag4', 'node-localstorage'],
  webpack(config) {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/polyfills/async-storage.ts'
      ),
      'pino-pretty': false
    }

    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
      layers: true
    }

    config.module = config.module ?? { rules: [] }
    config.module.rules = config.module.rules ?? []
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource'
    })

    return config
  }
}

export default nextConfig
