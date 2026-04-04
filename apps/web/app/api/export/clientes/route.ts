import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

export async function GET(request: NextRequest) {
  const auth = await checkExportRateLimit(request)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const filter = searchParams.get('filter') ?? 'active'

  const isActiveFilter =
    filter === 'active' ? true : filter === 'inactive' ? false : undefined

  const clients = await prisma.client.findMany({
    where: {
      tenant_id: tenantId,
      ...(isActiveFilter !== undefined ? { is_active: isActiveFilter } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { _count: { select: { appointments: true } } },
    orderBy: { name: 'asc' },
  })

  const header = ['Nome', 'Telefone', 'Email', 'Nascimento', 'Atendimentos', 'Status', 'Cadastro']
  const rows = clients.map((c) => [
    c.name,
    c.phone ?? '',
    c.email ?? '',
    c.birth_date ? new Date(c.birth_date).toLocaleDateString('pt-BR') : '',
    String(c._count.appointments),
    c.is_active ? 'Ativo' : 'Inativo',
    new Date(c.created_at).toLocaleDateString('pt-BR'),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const BOM = '\uFEFF'
  return new NextResponse(BOM + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
