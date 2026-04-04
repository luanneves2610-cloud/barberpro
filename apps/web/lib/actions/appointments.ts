'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import {
  sendWhatsApp,
  msgAgendamentoConfirmado,
  msgAgendamentoCancelado,
  msgServicoConcluidoComRecibo,
} from '@/lib/whatsapp'
import { getReminderQueue } from '@/lib/queue/queues'
import { checkAppointmentLimit } from '@/lib/plan/limits'
import type { AppointmentStatus } from '@barberpro/types'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const AppointmentSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  barber_id: z.string().min(1, 'Barbeiro obrigatório'),
  service_id: z.string().min(1, 'Serviço obrigatório'),
  date: z.string().min(1, 'Data obrigatória'),
  start_time: z.string().min(1, 'Horário obrigatório'),
  payment_method: z.enum(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']).optional(),
  notes: z.string().optional(),
  // Recorrência
  recurrence: z.enum(['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('NONE'),
  recurrence_count: z.coerce.number().min(1).max(12).default(1),
})

// Helper: avança uma data por N dias
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Helper: avança uma data por N meses
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// Calcula a lista de datas da recorrência
function buildRecurrenceDates(
  startDate: string,
  recurrence: string,
  count: number,
): string[] {
  const dates: string[] = [startDate]
  for (let i = 1; i < count; i++) {
    const prev = dates[dates.length - 1]
    if (recurrence === 'WEEKLY') dates.push(addDays(prev, 7))
    else if (recurrence === 'BIWEEKLY') dates.push(addDays(prev, 14))
    else if (recurrence === 'MONTHLY') dates.push(addMonths(prev, 1))
  }
  return dates
}

export async function createAppointment(formData: FormData) {
  const tenantId = await getTenantId()
  await checkAppointmentLimit(tenantId)
  const data = AppointmentSchema.parse(Object.fromEntries(formData))

  const [service, client, barber, tenant] = await Promise.all([
    prisma.service.findUnique({ where: { id: data.service_id } }),
    prisma.client.findUnique({ where: { id: data.client_id } }),
    prisma.barber.findUnique({ where: { id: data.barber_id } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, id: true } }),
  ])
  if (!service) throw new Error('Serviço não encontrado')

  const [h, m] = data.start_time.split(':').map(Number)
  const endMinutes = h * 60 + m + service.duration
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  // Gera group ID se recorrente
  const recurrenceGroupId =
    data.recurrence !== 'NONE' && data.recurrence_count > 1
      ? `rg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      : null

  const dates = data.recurrence !== 'NONE' && data.recurrence_count > 1
    ? buildRecurrenceDates(data.date, data.recurrence, data.recurrence_count)
    : [data.date]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Cria todos os agendamentos (1 ou N)
  const appointments = await Promise.all(
    dates.map((dateStr) =>
      prisma.appointment.create({
        data: {
          tenant_id: tenantId,
          client_id: data.client_id,
          barber_id: data.barber_id,
          service_id: data.service_id,
          date: new Date(dateStr + 'T12:00:00'),
          start_time: data.start_time,
          end_time: endTime,
          status: 'SCHEDULED',
          payment_method: data.payment_method ?? null,
          payment_status: 'PENDING',
          price: service.price,
          notes: data.notes || null,
          recurrence_group_id: recurrenceGroupId,
        },
      }),
    ),
  )

  const firstAppointment = appointments[0]

  // WhatsApp: confirmação do primeiro agendamento (com link de confirmação de presença)
  if (client?.phone) {
    const dateFormatted = new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    await sendWhatsApp(
      client.phone,
      msgAgendamentoConfirmado({
        clientName: client.name,
        barberName: barber?.name ?? 'Barbeiro',
        serviceName: service.name,
        date: dateFormatted,
        startTime: data.start_time,
        tenantName: tenant?.name ?? 'Barbearia',
        confirmUrl: baseUrl ? `${baseUrl}/confirmar/${firstAppointment.id}` : undefined,
        recurrenceCount: dates.length > 1 ? dates.length : undefined,
      }),
    )
  }

  // Enfileira lembrete 1h antes do primeiro agendamento
  if (client?.phone) {
    try {
      const [ah, am] = data.start_time.split(':').map(Number)
      const appointmentDateTime = new Date(data.date + 'T12:00:00')
      appointmentDateTime.setHours(ah, am, 0, 0)
      const reminderAt = appointmentDateTime.getTime() - 60 * 60 * 1000
      const delay = Math.max(0, reminderAt - Date.now())

      await getReminderQueue().add(
        'reminder',
        {
          appointmentId: firstAppointment.id,
          clientName: client.name,
          clientPhone: client.phone,
          barberName: barber?.name ?? 'Barbeiro',
          serviceName: service.name,
          date: new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long',
          }),
          startTime: data.start_time,
          tenantName: tenant?.name ?? 'Barbearia',
        },
        {
          delay,
          jobId: `reminder:${firstAppointment.id}`,
          removeOnComplete: true,
          removeOnFail: { count: 3 },
        },
      )
    } catch {
      // Redis indisponível — não bloqueia criação do agendamento
    }
  }

  revalidatePath('/dashboard/agenda')
  revalidatePath('/dashboard')
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const tenantId = await getTenantId()

  const updated = await prisma.appointment.update({
    where: { id, tenant_id: tenantId },
    data: {
      status,
      payment_status: status === 'COMPLETED' ? 'PAID' : undefined,
    },
    include: { client: true, service: true, barber: true },
  })

  // Cria transação de receita ao concluir
  if (status === 'COMPLETED') {
    await prisma.transaction.create({
      data: {
        tenant_id: tenantId,
        appointment_id: id,
        type: 'INCOME',
        category: 'Serviço',
        description: `${updated.service.name} — ${updated.client.name}`,
        amount: updated.price,
        payment_method: updated.payment_method ?? null,
        date: updated.date,
      },
    })

    // WhatsApp: recibo após conclusão
    if (updated.client.phone) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      })
      await sendWhatsApp(
        updated.client.phone,
        msgServicoConcluidoComRecibo({
          clientName: updated.client.name,
          serviceName: updated.service.name,
          price: Number(updated.price),
          tenantName: tenant?.name ?? 'Barbearia',
        }),
      )
    }
  }

  // WhatsApp: notificação de cancelamento
  if (status === 'CANCELLED' && updated.client.phone) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })
    const dateFormatted = updated.date.toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long',
    })
    await sendWhatsApp(
      updated.client.phone,
      msgAgendamentoCancelado({
        clientName: updated.client.name,
        date: dateFormatted,
        startTime: updated.start_time,
        tenantName: tenant?.name ?? 'Barbearia',
      }),
    )
  }

  revalidatePath('/dashboard/agenda')
  revalidatePath('/dashboard')
}

export async function cancelAppointment(id: string) {
  await updateAppointmentStatus(id, 'CANCELLED')
}

// ── Ações públicas (sem autenticação) ──────────────────────────────────────

export async function confirmAppointmentPresence(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return { ok: false, error: 'Agendamento não encontrado.' }
    if (appointment.status === 'CANCELLED') return { ok: false, error: 'Este agendamento foi cancelado.' }
    if (appointment.status === 'COMPLETED') return { ok: false, error: 'Este agendamento já foi concluído.' }
    if (appointment.confirmed_at) return { ok: true } // já confirmado

    await prisma.appointment.update({
      where: { id },
      data: { confirmed_at: new Date() },
    })

    // Notifica o painel
    await prisma.notification.create({
      data: {
        tenant_id: appointment.tenant_id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Presença confirmada',
        body: `Cliente confirmou presença para o agendamento de ${appointment.date.toLocaleDateString('pt-BR')} às ${appointment.start_time}.`,
      },
    })

    revalidatePath('/dashboard/agenda')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao confirmar presença. Tente novamente.' }
  }
}

export async function cancelAppointmentPublic(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    })
    if (!appointment) return { ok: false, error: 'Agendamento não encontrado.' }
    if (appointment.status === 'CANCELLED') return { ok: false, error: 'Este agendamento já foi cancelado.' }
    if (appointment.status === 'COMPLETED') return { ok: false, error: 'Este agendamento já foi concluído.' }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    await prisma.notification.create({
      data: {
        tenant_id: appointment.tenant_id,
        type: 'APPOINTMENT_CANCELLED',
        title: 'Agendamento cancelado pelo cliente',
        body: `${appointment.client.name} cancelou o agendamento de ${appointment.date.toLocaleDateString('pt-BR')} às ${appointment.start_time}.`,
      },
    })

    revalidatePath('/dashboard/agenda')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao cancelar. Tente novamente.' }
  }
}
