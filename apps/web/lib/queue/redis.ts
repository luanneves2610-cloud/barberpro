import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis?: Redis }

function createRedis() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
  const redis = new Redis(url, {
    maxRetriesPerRequest: null, // obrigatório para BullMQ
    enableReadyCheck: false,
  })
  redis.on('error', (err) => {
    // Log silencioso se Redis não estiver disponível (dev sem Redis)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Redis] Conexão indisponível:', err.message)
    }
  })
  return redis
}

export const redis = globalForRedis.redis ?? createRedis()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
