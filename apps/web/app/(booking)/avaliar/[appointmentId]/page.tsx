import { prisma } from '@barberpro/database'
import { notFound } from 'next/navigation'
import { RatingClient } from './rating-client'

interface Props {
  params: { appointmentId: string }
}

export async function generateMetadata({ params }: Props) {
  return { title: 'Avaliar atendimento' }
}

export default async function RatingPage({ params }: Props) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.appointmentId, status: 'COMPLETED' },
    include: {
      barber: { select: { name: true, rating: true } },
      service: { select: { name: true } },
      client: { select: { name: true } },
      tenant: { select: { name: true, logo_url: true } },
    },
  })

  if (!appointment) notFound()

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <RatingClient
        appointmentId={appointment.id}
        barberName={appointment.barber.name}
        serviceName={appointment.service.name}
        clientName={appointment.client.name}
        tenantName={appointment.tenant.name}
        date={appointment.date.toLocaleDateString('pt-BR', {
          weekday: 'long', day: 'numeric', month: 'long',
        })}
      />
    </div>
  )
}
