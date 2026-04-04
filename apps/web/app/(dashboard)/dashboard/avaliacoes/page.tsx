import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar } from '@barberpro/ui'
import { Star, StarOff } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Avaliações' }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={[
            'h-3.5 w-3.5',
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

export default async function AvaliacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenantId = profile.tenant_id

  // Fetch completed appointments with rating info
  const [barbers, recentRatings] = await Promise.all([
    prisma.barber.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: {
        id: true, name: true, avatar_url: true, rating: true,
        _count: { select: { appointments: { where: { status: 'COMPLETED' } } } },
      },
      orderBy: { rating: 'desc' },
    }),
    prisma.appointment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'COMPLETED',
        rating: { not: null },
      },
      include: {
        client: { select: { name: true } },
        barber: { select: { name: true, avatar_url: true } },
        service: { select: { name: true, icon: true } },
      },
      orderBy: { updated_at: 'desc' },
      take: 50,
    }),
  ])

  const totalRatings = recentRatings.length
  const avgRating = totalRatings > 0
    ? recentRatings.reduce((s, a) => s + (a.rating ?? 0), 0) / totalRatings
    : 0

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: recentRatings.filter((a) => Math.round(a.rating ?? 0) === star).length,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Avaliações"
        description={`${totalRatings} avaliação(ões) recebida(s)`}
      />

      {totalRatings === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <StarOff className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-400">Nenhuma avaliação recebida ainda</p>
          <p className="text-xs text-zinc-600 mt-1">
            As avaliações aparecem quando clientes respondem o link enviado após o atendimento.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Média */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col items-center justify-center gap-2">
              <p className="text-5xl font-black text-amber-400">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} />
              <p className="text-xs text-zinc-500">{totalRatings} avaliação(ões)</p>
            </div>

            {/* Distribuição */}
            <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-semibold text-zinc-400 mb-3">Distribuição</p>
              <div className="space-y-2">
                {dist.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-4 shrink-0">{star}</span>
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500/70"
                        style={{ width: totalRatings > 0 ? `${(count / totalRatings) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-5 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking de barbeiros */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Ranking de Barbeiros</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {barbers.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-sm font-bold text-zinc-600 w-5 shrink-0">#{idx + 1}</span>
                  {b.avatar_url ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                      <Image src={b.avatar_url} alt={b.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <Avatar name={b.name} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100">{b.name}</p>
                    <p className="text-xs text-zinc-500">{b._count.appointments} atendimento(s)</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRating rating={Number(b.rating)} />
                    <span className="text-sm font-bold text-amber-400">
                      {Number(b.rating) > 0 ? Number(b.rating).toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas avaliações */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Últimas Avaliações</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {recentRatings.map((a) => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={a.client.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{a.client.name}</p>
                        <p className="text-xs text-zinc-500">
                          {a.service.icon ? `${a.service.icon} ` : ''}{a.service.name} · {a.barber.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StarRating rating={a.rating ?? 0} />
                      <span className="text-[10px] text-zinc-600">
                        {new Date(a.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {a.rating_comment && (
                    <p className="text-sm text-zinc-400 italic ml-10">&ldquo;{a.rating_comment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
