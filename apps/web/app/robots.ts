import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberpro.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/agendar/',   // booking — não indexar (privado do cliente)
          '/avaliar/',
          '/confirmar/',
          '/sucesso',
          '/cancelamento',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
