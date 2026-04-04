import { prisma } from '@barberpro/database'
import Link from 'next/link'
import { ExternalLink, Search } from 'lucide-react'
import { AdminTenantActions } from './tenant-actions'

export default async function AdminTenantsPage({ searchParams }: { searchParams: { q?: string; plan?: string } }) {
  const q = searchParams.q?.trim()
  const planFilter = searchParams.plan

  const tenants = await prisma.tenant.findMany({
    where: {
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
      ...(planFilter ? { plan: planFilter as any } : {}),
    },
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { barbers: true, appointments: true, profiles: true } },
      subscriptions: {
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { status: true, plan: true, ends_at: true },
      },
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Barbearias</h1>
          <p className="text-sm text-zinc-400">{tenants.length} cadastradas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou slug..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </form>
        <div className="flex gap-1.5">
          {[undefined, 'BASIC', 'PRO', 'ENTERPRISE'].map((p) => (
            <a
              key={p ?? 'all'}
              href={p ? `/admin/tenants?plan=${p}` : '/admin/tenants'}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                (p ?? '') === (planFilter ?? '')
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {p ?? 'Todos'}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Barbearia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden sm:table-cell">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Plano</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 hidden md:table-cell">Usuários</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 hidden md:table-cell">Ag.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                  <p className="text-xs text-zinc-600">{t.created_at.toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-zinc-500 font-mono">{t.slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    t.plan === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400' :
                    t.plan === 'PRO' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-zinc-700/50 text-zinc-400'
                  }`}>
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${
                    t.status === 'ACTIVE' ? 'text-green-400' :
                    t.status === 'SUSPENDED' ? 'text-red-400' : 'text-zinc-500'
                  }`}>
                    {t.status === 'ACTIVE' ? 'Ativa' : t.status === 'SUSPENDED' ? 'Suspensa' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-400 hidden md:table-cell">
                  {t._count.profiles}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-400 hidden md:table-cell">
                  {t._count.appointments}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/agendar/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                      title="Ver página pública"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <AdminTenantActions tenantId={t.id} currentStatus={t.status} currentPlan={t.plan} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
