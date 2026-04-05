import { prisma } from '@barberpro/database'
import { Users, Scissors, CreditCard, TrendingUp, Activity } from 'lucide-react'

export default async function AdminDashboard() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalTenants,
    activeTenants,
    totalProfiles,
    newTenantsThisMonth,
    planCounts,
    recentTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.profile.count(),
    prisma.tenant.count({ where: { created_at: { gte: firstOfMonth } } }),
    prisma.tenant.groupBy({ by: ['plan'], _count: true }),
    prisma.tenant.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true, name: true, slug: true, plan: true, status: true, created_at: true,
        _count: { select: { barbers: true, appointments: true } },
      },
    }),
  ])

  const planMap = Object.fromEntries(planCounts.map((p: { plan: string; _count: number }) => [p.plan, p._count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Super Admin</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Visão geral de todas as barbearias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Barbearias', value: totalTenants, sub: `${activeTenants} ativas`, Icon: Scissors, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Usuários', value: totalProfiles, sub: 'perfis cadastrados', Icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Novos no mês', value: newTenantsThisMonth, sub: 'barbearias', Icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Plano PRO+', value: (planMap['PRO'] ?? 0) + (planMap['ENTERPRISE'] ?? 0), sub: 'pagantes', Icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${bg} shrink-0`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-400">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-zinc-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Distribuição de planos</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: 'BASIC', label: 'Básico', color: 'bg-zinc-600' },
            { plan: 'PRO', label: 'Pro', color: 'bg-amber-500' },
            { plan: 'ENTERPRISE', label: 'Enterprise', color: 'bg-purple-500' },
          ].map(({ plan, label, color }) => {
            const count = planMap[plan] ?? 0
            const pct = totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0
            return (
              <div key={plan} className="text-center space-y-2">
                <div className="h-20 flex items-end justify-center">
                  <div
                    className={`w-12 rounded-t-lg ${color} transition-all`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-zinc-200">{count}</p>
                <p className="text-xs text-zinc-500">{label} ({pct}%)</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent tenants */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Últimas barbearias cadastradas</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Barbearia</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 hidden sm:table-cell">Slug</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Plano</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 hidden md:table-cell">Barbeiros</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 hidden md:table-cell">Agendamentos</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 hidden lg:table-cell">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {recentTenants.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-xs text-zinc-500 font-mono">{t.slug}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    t.plan === 'ENTERPRISE' ? 'bg-purple-500/15 text-purple-400' :
                    t.plan === 'PRO' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-zinc-700/50 text-zinc-400'
                  }`}>
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 text-xs ${
                    t.status === 'ACTIVE' ? 'text-green-400' :
                    t.status === 'SUSPENDED' ? 'text-red-400' : 'text-zinc-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      t.status === 'ACTIVE' ? 'bg-green-500' :
                      t.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-zinc-600'
                    }`} />
                    {t.status === 'ACTIVE' ? 'Ativa' : t.status === 'SUSPENDED' ? 'Suspensa' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-zinc-300 hidden md:table-cell">
                  {t._count.barbers}
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-zinc-300 hidden md:table-cell">
                  {t._count.appointments}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-zinc-500 hidden lg:table-cell">
                  {t.created_at.toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
