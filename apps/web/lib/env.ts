/**
 * Validação de variáveis de ambiente em tempo de execução.
 *
 * Variáveis OBRIGATÓRIAS → lança erro de inicialização se ausentes (fail-fast).
 * Variáveis OPCIONAIS  → logs de aviso; a feature correspondente é desativada.
 *
 * Uso: importe `env` em vez de `process.env` para ter tipagem e validação.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[BarberPro] Variável de ambiente obrigatória ausente: ${key}\n` +
      `Verifique o arquivo .env.local ou as variáveis de ambiente do servidor.`,
    )
  }
  return value
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

// ── Obrigatórias ────────────────────────────────────────────────────────────
export const env = {
  // Supabase
  SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Database (Prisma)
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // App
  APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),

  // ── Opcionais (features desativadas graciosamente se ausentes) ─────────────

  // Redis / BullMQ
  REDIS_URL: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

  // WhatsApp (Evolution API)
  EVOLUTION_API_URL: optionalEnv('EVOLUTION_API_URL'),
  EVOLUTION_API_KEY: optionalEnv('EVOLUTION_API_KEY'),
  EVOLUTION_INSTANCE: optionalEnv('EVOLUTION_INSTANCE'),
  get whatsappConfigured(): boolean {
    return !!(this.EVOLUTION_API_URL && this.EVOLUTION_API_KEY && this.EVOLUTION_INSTANCE)
  },

  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: optionalEnv('MERCADOPAGO_ACCESS_TOKEN'),
  MERCADOPAGO_WEBHOOK_SECRET: optionalEnv('MERCADOPAGO_WEBHOOK_SECRET'),
  get mercadoPagoConfigured(): boolean {
    return !!(this.MERCADOPAGO_ACCESS_TOKEN)
  },

  // Focus NFe
  FOCUS_NFE_TOKEN: optionalEnv('FOCUS_NFE_TOKEN'),
  FOCUS_NFE_ENV: optionalEnv('FOCUS_NFE_ENV', 'homologacao') as 'homologacao' | 'producao',
  get nfeConfigured(): boolean {
    return !!(this.FOCUS_NFE_TOKEN)
  },
} as const

/**
 * Loga no console quais integrações opcionais estão configuradas.
 * Chame uma vez na inicialização (ex: no workers.ts ou app startup).
 */
export function logEnvStatus() {
  const ok = '✅'
  const warn = '⚠️ '
  console.log('\n[BarberPro] Status das integrações:')
  console.log(`  ${ok} Database: configurado`)
  console.log(`  ${env.whatsappConfigured ? ok : warn} WhatsApp (Evolution API): ${env.whatsappConfigured ? 'configurado' : 'não configurado'}`)
  console.log(`  ${env.mercadoPagoConfigured ? ok : warn} Mercado Pago: ${env.mercadoPagoConfigured ? 'configurado' : 'não configurado'}`)
  console.log(`  ${env.nfeConfigured ? ok : warn} Focus NFe: ${env.nfeConfigured ? `configurado (${env.FOCUS_NFE_ENV})` : 'não configurado'}`)
  console.log(`  ${env.REDIS_URL !== 'redis://localhost:6379' ? ok : warn} Redis: ${env.REDIS_URL}\n`)
}
