/**
 * Workers BullMQ — executados em processo separado (não no Next.js)
 *
 * Para rodar: npx tsx apps/web/lib/queue/workers.ts
 * Em produção: pm2 start apps/web/lib/queue/workers.ts --interpreter tsx
 */

import { Worker, Queue } from 'bullmq'
import { redis } from './redis'
import {
  QUEUE_WHATSAPP_REMINDER,
  QUEUE_WHATSAPP_BLAST,
  QUEUE_NFE,
  QUEUE_BIRTHDAY,
  QUEUE_REENGAGEMENT,
  type ReminderJobData,
  type BlastJobData,
  type NfeJobData,
  type BirthdayCronJobData,
  type ReengagementCronJobData,
} from './queues'
import {
  sendWhatsApp,
  msgAgendamentoConfirmado,
  msgAniversario,
  msgReengajamento,
} from '@/lib/whatsapp'
import { prisma } from '@barberpro/database'
import { logEnvStatus } from '@/lib/env'

// ──────────────────────────────────────
// Worker: lembretes de WhatsApp
// ──────────────────────────────────────
const reminderWorker = new Worker<ReminderJobData>(
  QUEUE_WHATSAPP_REMINDER,
  async (job) => {
    const d = job.data
    const msg = msgAgendamentoConfirmado({
      clientName: d.clientName,
      barberName: d.barberName,
      serviceName: d.serviceName,
      date: d.date,
      startTime: d.startTime,
      tenantName: d.tenantName,
    })
    await sendWhatsApp(d.clientPhone, `⏰ *Lembrete de agendamento!*\n\n${msg}`)
    console.log(`[Reminder] Enviado para ${d.clientPhone} — job ${job.id}`)
  },
  { connection: redis, concurrency: 5 },
)

reminderWorker.on('failed', (job, err) => {
  console.error(`[Reminder] Job ${job?.id} falhou:`, err.message)
})

// ──────────────────────────────────────
// Worker: disparos em massa (WhatsApp blast)
// ──────────────────────────────────────
const blastWorker = new Worker<BlastJobData>(
  QUEUE_WHATSAPP_BLAST,
  async (job) => {
    const { phones, message } = job.data
    let sent = 0
    for (const phone of phones) {
      await sendWhatsApp(phone, message)
      sent++
      // Delay de 1s entre mensagens para evitar bloqueio
      await new Promise((r) => setTimeout(r, 1000))
    }
    console.log(`[Blast] ${sent} mensagens enviadas — job ${job.id}`)
    return { sent }
  },
  { connection: redis, concurrency: 1 },
)

blastWorker.on('failed', (job, err) => {
  console.error(`[Blast] Job ${job?.id} falhou:`, err.message)
})

// ──────────────────────────────────────
// Worker: emissão automática de NF-e
// ──────────────────────────────────────
const nfeWorker = new Worker<NfeJobData>(
  QUEUE_NFE,
  async (job) => {
    const { emitirNFeAgendamento } = await import('@/lib/actions/nfe')
    const result = await emitirNFeAgendamento(job.data.appointmentId)
    console.log(`[NFe] Emitida para appointment ${job.data.appointmentId} — status: ${result.status}`)
    return result
  },
  { connection: redis, concurrency: 2 },
)

nfeWorker.on('failed', (job, err) => {
  console.error(`[NFe] Job ${job?.id} falhou:`, err.message)
})

// ──────────────────────────────────────
// Worker: mensagens de aniversário (cron diário 09:00)
// ──────────────────────────────────────
const birthdayWorker = new Worker<BirthdayCronJobData>(
  QUEUE_BIRTHDAY,
  async () => {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    // Busca todos os clientes com aniversário (filtragem em JS — evita raw SQL)
    const clients = await prisma.client.findMany({
      where: { is_active: true, phone: { not: null }, birth_date: { not: null } },
      include: { tenant: { select: { name: true } } },
    })

    const birthday = clients.filter((c) => {
      if (!c.birth_date) return false
      const d = new Date(c.birth_date)
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay
    })

    let sent = 0
    for (const client of birthday) {
      if (!client.phone) continue
      await sendWhatsApp(
        client.phone,
        msgAniversario({ clientName: client.name, tenantName: client.tenant.name }),
      )
      sent++
      await new Promise((r) => setTimeout(r, 800))
    }

    console.log(`[Birthday] ${sent} mensagens de aniversário enviadas`)
    return { sent }
  },
  { connection: redis, concurrency: 1 },
)

birthdayWorker.on('failed', (job, err) => {
  console.error(`[Birthday] Job ${job?.id} falhou:`, err.message)
})

// ──────────────────────────────────────
// Worker: reengajamento (cron semanal seg 10:00)
// ──────────────────────────────────────
const reengagementWorker = new Worker<ReengagementCronJobData>(
  QUEUE_REENGAGEMENT,
  async (job) => {
    const inactiveDays = job.data.inactiveDays ?? 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - inactiveDays)

    // Clientes que tiveram agendamento concluído, mas o último foi antes do cutoff
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    })

    let sent = 0

    for (const tenant of tenants) {
      // Clientes ativos com telefone neste tenant
      const clients = await prisma.client.findMany({
        where: { tenant_id: tenant.id, is_active: true, phone: { not: null } },
        select: { id: true, name: true, phone: true },
      })

      for (const client of clients) {
        if (!client.phone) continue

        // Último agendamento concluído
        const lastAppt = await prisma.appointment.findFirst({
          where: {
            tenant_id: tenant.id,
            client_id: client.id,
            status: 'COMPLETED',
          },
          orderBy: { date: 'desc' },
          select: { date: true },
        })

        // Se nunca teve agendamento ou o último foi antes do cutoff → reengajar
        if (!lastAppt || lastAppt.date < cutoff) {
          const diasSemVisita = lastAppt
            ? Math.floor((Date.now() - lastAppt.date.getTime()) / 86400000)
            : inactiveDays

          await sendWhatsApp(
            client.phone,
            msgReengajamento({ clientName: client.name, tenantName: tenant.name, diasSemVisita }),
          )
          sent++
          await new Promise((r) => setTimeout(r, 800))
        }
      }
    }

    console.log(`[Reengagement] ${sent} mensagens de reengajamento enviadas`)
    return { sent }
  },
  { connection: redis, concurrency: 1 },
)

reengagementWorker.on('failed', (job, err) => {
  console.error(`[Reengagement] Job ${job?.id} falhou:`, err.message)
})

// ──────────────────────────────────────
// Agendamento dos cron jobs (registra uma vez na inicialização)
// ──────────────────────────────────────
async function scheduleCronJobs() {
  const birthdayQueue = new Queue(QUEUE_BIRTHDAY, { connection: redis })
  const reengagementQueue = new Queue(QUEUE_REENGAGEMENT, { connection: redis })

  // Aniversário: todo dia às 09:00
  await birthdayQueue.add(
    'birthday-daily',
    { runAt: 'cron' },
    {
      repeat: { pattern: '0 9 * * *' },
      jobId: 'birthday-daily-cron',
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
    },
  )

  // Reengajamento: toda segunda-feira às 10:00 (clientes sem visita há 30+ dias)
  await reengagementQueue.add(
    'reengagement-weekly',
    { runAt: 'cron', inactiveDays: 30 },
    {
      repeat: { pattern: '0 10 * * 1' },
      jobId: 'reengagement-weekly-cron',
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 3 },
    },
  )

  console.log('   • Cron birthday: diário 09:00')
  console.log('   • Cron reengajamento: semanalmente (seg 10:00)')
}

scheduleCronJobs().catch((err) => {
  console.error('[Cron] Falha ao registrar cron jobs:', err.message)
})

// Exibe status das integrações na inicialização
logEnvStatus()

console.log('✅ Workers BullMQ iniciados')
console.log(`   • ${QUEUE_WHATSAPP_REMINDER}`)
console.log(`   • ${QUEUE_WHATSAPP_BLAST}`)
console.log(`   • ${QUEUE_NFE}`)
console.log(`   • ${QUEUE_BIRTHDAY}`)
console.log(`   • ${QUEUE_REENGAGEMENT}`)

// Graceful shutdown
process.on('SIGTERM', async () => {
  await Promise.all([
    reminderWorker.close(),
    blastWorker.close(),
    nfeWorker.close(),
    birthdayWorker.close(),
    reengagementWorker.close(),
  ])
  process.exit(0)
})
