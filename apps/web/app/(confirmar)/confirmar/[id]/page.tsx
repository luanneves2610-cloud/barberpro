import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@barberpro/database'
import { ConfirmarClient } from './confirmar-client'

export const metadata: Metadata = { title: 'Confirmar Presença' }

export default async function ConfirmarPage({ params }: { params: { id: string } }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { name: true } },
      barber: { select: { name: true } },
      service: { select: { name: true, icon: true } },
      tenant: { select: { name: true } },
    },
  })

  if (!appointment) notFound()

  const data = {
    id: appointment.id,
    status: appointment.status,
    confirmedAt: appointment.confirmed_at?.toISOString() ?? null,
    date: appointment.date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }),
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    clientName: appointment.client.name,
    barberName: appointment.barber.name,
    serviceName: appointment.service.name,
    serviceIcon: appointment.service.icon,
    tenantName: appointment.tenant.name,
    price: Number(appointment.price),
  }

  return <ConfirmarClient appointment={data} />
}
