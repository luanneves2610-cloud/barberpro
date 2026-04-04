/**
 * Rate limiter baseado em Redis (sliding window com INCR + EXPIRE)
 *
 * Uso:
 *   const result = await rateLimit(`rating:${ip}`, 5, 60)
 *   if (!result.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { redis } from '@/lib/queue/redis'

export interface RateLimitResult {
  ok: boolean        // true se dentro do limite
  limit: number      // máximo de requisições
  remaining: number  // restantes na janela atual
  reset: number      // timestamp Unix (ms) quando a janela reseta
}

/**
 * Limita requisições por `identifier` a `limit` chamadas dentro de `windowSeconds`.
 * Retorna { ok: false } se o limite foi atingido.
 * Em caso de erro no Redis (Redis offline), permite a requisição (fail-open).
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.ttl(key)
    const [[, count], [, ttl]] = (await pipeline.exec()) as [[null, number], [null, number]]

    // Define expiração apenas na primeira requisição da janela
    if (ttl === -1) {
      await redis.expire(key, windowSeconds)
    }

    const remaining = Math.max(0, limit - count)
    const reset = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000

    return { ok: count <= limit, limit, remaining, reset }
  } catch {
    // Redis offline → fail-open (não bloqueia a requisição)
    return { ok: true, limit, remaining: limit, reset: Date.now() + windowSeconds * 1000 }
  }
}

/**
 * Extrai o IP real do cliente considerando proxies (Vercel, Nginx, Cloudflare).
 */
export function getClientIp(request: Request): string {
  const headers = request instanceof Request
    ? Object.fromEntries((request as Request).headers.entries())
    : {}

  return (
    headers['cf-connecting-ip'] ??        // Cloudflare
    headers['x-real-ip'] ??               // Nginx proxy
    headers['x-forwarded-for']?.split(',')[0].trim() ?? // Vercel / load balancer
    'unknown'
  )
}

/**
 * Retorna headers padrão de rate limit para incluir na resposta.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    'Retry-After': result.ok ? '0' : String(Math.ceil((result.reset - Date.now()) / 1000)),
  }
}
