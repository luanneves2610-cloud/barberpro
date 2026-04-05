import { prisma } from '@barberpro/database'
import { Users } from 'lucide-react'

export default async function AdminUsuariosPage() {
  const profiles = await prisma.profile.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      tenant: { select: { name: true, slug: true, plan: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Usuários</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Todos os perfis cadastrados no sistema</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-300">{profiles.length} usuários</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Nome</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">E-mail</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Perfil</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 hidden md:table-cell">Barbearia</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 hidden lg:table-cell">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-sm font-medium text-zinc-200">{p.full_name || '—'}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-sm text-zinc-400">{p.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.role === 'SUPER_ADMIN' ? 'bg-red-500/15 text-red-400' :
                    p.role === 'OWNER' ? 'bg-amber-500/15 text-amber-400' :
                    p.role === 'BARBER' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-zinc-700/50 text-zinc-400'
                  }`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  {p.tenant ? (
                    <div>
                      <p className="text-sm text-zinc-300">{p.tenant.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{p.tenant.slug}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-zinc-500 hidden lg:table-cell">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
