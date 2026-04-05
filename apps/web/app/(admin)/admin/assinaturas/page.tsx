import { prisma } from '@barberpro/database'
import { CreditCard } from 'lucide-react'

export default async function AdminAssinaturasPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true, name: true, slug: true, plan: true, status: true,
      created_at: true,
      profiles: { where: { role: 'OWNER' }, select: { email: true }, take: 1 },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Assinaturas</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Planos e assinaturas de todas as barbearias</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-300">{tenants.length} barbearias</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Barbearia</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Proprietário</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Plano</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 hidden lg:table-cell">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                  <p className="text-xs text-zinc-500 font-mono">{t.slug}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-sm text-zinc-400">{t.profiles[0]?.email || '—'}</p>
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
                <td className="px-4 py-2.5 text-right text-xs text-zinc-500 hidden lg:table-cell">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
