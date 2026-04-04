import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { z } from 'zod'
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'

const RatingSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  // Rate limit: 5 avaliações por IP a cada 60s
  const ip = getClientIp(request)
  const rl = await rateLimit(`rating:${ip}`, 5, 60)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns segundos.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  try {
    const body = await request.json()
    const data = RatingSchema.parse(body)

    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId, status: 'COMPLETED' },
      include: { barber: true, client: true },
    })
    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
    }

    // Prevent double rating
    if (appointment.rating !== null) {
      return NextResponse.json({ error: 'Agendamento já foi avaliado.' }, { status: 409 })
    }

    // Update appointment with rating
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: {
        rating: data.rating,
        rating_comment: data.comment ?? null,
      },
    })

    // Update barber rating (moving average based on all completed + rated appointments)
    const barber = appointment.barber
    const ratedAppointments = await prisma.appointment.findMany({
      where: { barber_id: barber.id, rating: { not: null } },
      select: { rating: true },
    })
    const allRatings = [...ratedAppointments.map((a) => a.rating!), data.rating]
    const avgRating = allRatings.reduce((s, r) => s + r, 0) / allRatings.length

    await prisma.barber.update({
      where: { id: barber.id },
      data: { rating: avgRating },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        tenant_id: appointment.tenant_id,
        title: `Avaliação recebida ⭐`,
        body: `${appointment.client.name} avaliou ${barber.name} com ${data.rating} estrelas${data.comment ? `: "${data.comment}"` : '.'}`,
        type: 'SYSTEM',
        data: { appointmentId: data.appointmentId, rating: data.rating },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 400 })
  }
}
