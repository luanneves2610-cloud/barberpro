import { notFound } from 'next/navigation'
import { prisma } from '@barberpro/database'
import { Scissors } from 'lucide-react'
import { BookingClient } from './booking-client'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  })
  return {
    title: tenant ? `Agendar — ${tenant.name}` : 'Agendamento Online',
  }
}

export default async function PublicBookingPage({ params }: Props) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      state: true,
      logo_url: true,
    },
  })

  if (!tenant) notFound()

  const [barbers, services] = await Promise.all([
    prisma.barber.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      select: { id: true, name: true, bio: true, avatar_url: true, rating: true },
      orderBy: { name: 'asc' },
    }),
    prisma.service.findMany({
      where: { tenant_id: tenant.id, is_active: true },
      select: { id: true, name: true, duration: true, price: true, description: true, icon: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 mb-4">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <Scissors className="h-8 w-8 text-zinc-950" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{tenant.name}</h1>
          {(tenant.city || tenant.state) && (
            <p className="mt-1 text-sm text-zinc-400">
              {[tenant.city, tenant.state].filter(Boolean).join(', ')}
            </p>
          )}
          {tenant.phone && (
            <p className="text-sm text-zinc-500">{tenant.phone}</p>
          )}
        </div>

        {barbers.length === 0 || services.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">Agendamento online indisponível no momento.</p>
            {tenant.phone && (
              <p className="mt-2 text-sm text-zinc-500">
                Entre em contato: <span className="text-amber-400">{tenant.phone}</span>
              </p>
            )}
          </div>
        ) : (
          <BookingClient
            tenantId={tenant.id}
            barbers={barbers.map((b) => ({ ...b, rating: Number(b.rating) }))}
            services={services.map((s) => ({ ...s, price: Number(s.price) }))}
          />
        )}
      </div>
    </div>
  )
}
