/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@barberpro/ui', '@barberpro/types', '@barberpro/database'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  output: 'standalone',

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'ioredis', 'bullmq'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // Cache static assets
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin',
        permanent: false,
      },
    ]
  },

  // Logging
  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === 'development' },
  },

  // Bundle analyzer (set ANALYZE=true)
  ...(process.env.ANALYZE === 'true' ? {
    // install @next/bundle-analyzer if needed
  } : {}),
}

module.exports = nextConfig
