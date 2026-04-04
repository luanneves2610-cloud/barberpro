'use server'

import { z } from 'zod'
import { prisma } from '@barberpro/database'
import {
  sendWhatsApp,
  msgAgendamentoConfirmado,
} from '@/lib/whatsapp'
import { getReminderQueue } from '@/lib/queue/queues'
import { checkAppointmentLimit } from '@/lib/plan/limits'

const PublicBookingSchema = z.object({
  tenantId: z.string().min(1),
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(8, 'Telefone obrigatório'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export type PublicBookingResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string }

export async function createPublicBooking(
  formData: FormData,
): Promise<PublicBookingResult> {
  try {
    const raw = Object.fromEntries(formData)
    const data = PublicBookingSchema.parse(raw)

    // Validate tenant is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId, status: 'ACTIVE' },
      select: { id: true, name: true },
    })
    if (!tenant) return { success: false, error: 'Barbearia não encontrada.' }

    // Check plan limit
    await checkAppointmentLimit(data.tenantId)

    // Validate service
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId, tenant_id: data.tenantId, is_active: true },
    })
    if (!service) return { success: false, error: 'Serviço não disponível.' }

    // Validate barber
    const barber = await prisma.barber.findUnique({
      where: { id: data.barberId, tenant_id: data.tenantId, is_active: true },
    })
    if (!barber) return { success: false, error: 'Barbeiro não disponível.' }

    // Check for conflicts (barber already booked at this time)
    const appointmentDate = new Date(data.date + 'T12:00:00')
    const [h, m] = data.startTime.split(':').map(Number)
    const endMinutes = h * 60 + m + service.duration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

    const conflict = await prisma.appointment.findFirst({
      where: {
        tenant_id: data.tenantId,
        barber_id: data.barberId,
        date: appointmentDate,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        OR: [
          { start_time: { gte: data.startTime, lt: endTime } },
          { end_time: { gt: data.startTime, lte: endTime } },
          {
            AND: [
              { start_time: { lte: data.startTime } },
              { end_time: { gte: endTime } },
            ],
          },
        ],
      },
    })
    if (conflict) return { success: false, error: 'Horário indisponível. Escolha outro.' }

    // Find or create client by phone + tenantId
    let client = await prisma.client.findFirst({
      where: { tenant_id: data.tenantId, phone: data.clientPhone },
    })
    if (!client) {
      client = await prisma.client.create({
        data: {
          tenant_id: data.tenantId,
          name: data.clientName,
          phone: data.clientPhone,
          email: data.clientEmail || null,
        },
      })
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenant_id: data.tenantId,
        client_id: client.id,
        barber_id: data.barberId,
        service_id: data.serviceId,
        date: appointmentDate,
        start_time: data.startTime,
        end_time: endTime,
        status: 'SCHEDULED',
        payment_status: 'PENDING',
        price: service.price,
        notes: data.notes || null,
      },
    })

    const dateFormatted = appointmentDate.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    // WhatsApp confirmation
    if (client.phone) {
      await sendWhatsApp(
        client.phone,
        msgAgendamentoConfirmado({
          clientName: client.name,
          barberName: barber.name,
          serviceName: service.name,
          date: dateFormatted,
          startTime: data.startTime,
          tenantName: tenant.name,
        }),
      )
    }

    // Enqueue reminder 1h before
    if (client.phone) {
      try {
        const dt = new Date(data.date + 'T12:00:00')
        dt.setHours(h, m, 0, 0)
        const delay = Math.max(0, dt.getTime() - 60 * 60 * 1000 - Date.now())
        await getReminderQueue().add(
          'reminder',
          {
            appointmentId: appointment.id,
            clientName: client.name,
            clientPhone: client.phone,
            barberName: barber.name,
            serviceName: service.name,
            date: dateFormatted,
            startTime: data.startTime,
            tenantName: tenant.name,
          },
          {
            delay,
            jobId: `reminder:${appointment.id}`,
            removeOnComplete: true,
            removeOnFail: { count: 3 },
          },
        )
      } catch {
        // Redis indisponível — não bloqueia
      }
    }

    // Create notification for tenant
    await prisma.notification.create({
      data: {
        tenant_id: data.tenantId,
        title: 'Novo agendamento (online)',
        body: `${client.name} agendou ${service.name} com ${barber.name} para ${dateFormatted} às ${data.startTime}.`,
        type: 'APPOINTMENT_CONFIRMED',
        data: { appointmentId: appointment.id },
      },
    })

    return { success: true, appointmentId: appointment.id }
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    return { success: false, error: 'Erro ao realizar agendamento.' }
  }
}

/** Returns available time slots for a barber/date/service combo */
export async function getAvailableSlots(
  tenantId: string,
  barberId: string,
  serviceId: string,
  dateStr: string,
): Promise<string[]> {
  const [service, barber] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.barber.findUnique({ where: { id: barberId } }),
  ])
  if (!service || !barber) return []

  const date = new Date(dateStr + 'T12:00:00')
  const dayOfWeek = date.getDay()

  // Get barber's schedule for this day
  const schedule = await prisma.barberSchedule.findUnique({
    where: { barber_id_day_of_week: { barber_id: barberId, day_of_week: dayOfWeek } },
  })
  if (!schedule || !schedule.is_active) return []

  // Get existing appointments for this barber/date
  const booked = await prisma.appointment.findMany({
    where: {
      barber_id: barberId,
      date,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
    select: { start_time: true, end_time: true },
  })

  // Build slots from schedule start to end (30min intervals)
  const slots: string[] = []
  const [startH, startM] = schedule.start_time.split(':').map(Number)
  const [endH, endM] = schedule.end_time.split(':').map(Number)
  const scheduleStart = startH * 60 + startM
  const scheduleEnd = endH * 60 + endM

  for (let t = scheduleStart; t + service.duration <= scheduleEnd; t += 30) {
    const slotStart = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
    const slotEndMin = t + service.duration
    const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`

    const isBooked = booked.some(
      (b) => slotStart < b.end_time && slotEnd > b.start_time,
    )

    // Don't show past slots for today
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday && t <= now.getHours() * 60 + now.getMinutes()) continue

    if (!isBooked) slots.push(slotStart)
  }

  return slots
}
