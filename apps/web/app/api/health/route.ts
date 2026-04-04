import { NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { redis } from '@/lib/queue/redis'

type ServiceStatus = 'ok' | 'degraded' | 'down'

interface HealthCheck {
  status: ServiceStatus
  latencyMs: number
  error?: string
}

export async function GET() {
  const start = Date.now()

  // Check database
  const db = await checkDatabase()

  // Check Redis
  const cache = await checkRedis()

  const allOk = db.status === 'ok' && cache.status === 'ok'
  const anyDown = db.status === 'down' || cache.status === 'down'
  const overallStatus: ServiceStatus = allOk ? 'ok' : anyDown ? 'down' : 'degraded'

  const payload = {
    status: overallStatus,
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'production',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - start,
    services: {
      database: db,
      cache,
    },
  }

  return NextResponse.json(payload, {
    status: overallStatus === 'down' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

async function checkDatabase(): Promise<HealthCheck> {
  const t = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', latencyMs: Date.now() - t }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - t,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const t = Date.now()
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ])
    if (pong !== 'PONG') throw new Error('Unexpected response')
    return { status: 'ok', latencyMs: Date.now() - t }
  } catch (err) {
    return {
      status: 'degraded', // Redis é opcional (workers apenas) — degraded, não down
      latencyMs: Date.now() - t,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
