import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers.map((h) => {
        const v = row[h]
        const str = v === null || v === undefined ? '' : String(v)
        return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(';'),
    ),
  ]
  return '\uFEFF' + lines.join('\r\n') // BOM para Excel reconhecer UTF-8
}

export async function GET(req: NextRequest) {
  const auth = await checkExportRateLimit(req)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'appointments'
  const range = Number(searchParams.get('range') ?? '30')
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000)

  let csv = ''
  let filename = 'relatorio'

  if (type === 'appointments') {
    const rows = await prisma.appointment.findMany({
      where: { tenant_id: tenantId, date: { gte: since } },
      include: {
        client: { select: { name: true, phone: true } },
        barber: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })
    const data = rows.map((a) => ({
      Data: new Date(a.date).toLocaleDateString('pt-BR'),
      Horário: a.start_time,
      Cliente: a.client.name,
      Telefone: a.client.phone ?? '',
      Barbeiro: a.barber.name,
      Serviço: a.service.name,
      Status: a.status,
      'Pagamento': a.payment_method ?? '',
      'Valor (R$)': Number(a.price).toFixed(2).replace('.', ','),
    }))
    csv = toCSV(data)
    filename = `agendamentos_${range}d`
  } else if (type === 'transactions') {
    const rows = await prisma.transaction.findMany({
      where: { tenant_id: tenantId, date: { gte: since } },
      orderBy: { date: 'desc' },
    })
    const data = rows.map((t) => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: t.category ?? '',
      Descrição: t.description ?? '',
      'Forma Pagamento': t.payment_method ?? '',
      'Valor (R$)': Number(t.amount).toFixed(2).replace('.', ','),
    }))
    csv = toCSV(data)
    filename = `financeiro_${range}d`
  } else if (type === 'clients') {
    const rows = await prisma.client.findMany({
      where: { tenant_id: tenantId },
      include: { _count: { select: { appointments: true } } },
      orderBy: { name: 'asc' },
    })
    const data = rows.map((c) => ({
      Nome: c.name,
      Telefone: c.phone ?? '',
      Email: c.email ?? '',
      'Data Nasc.': c.birth_date ? new Date(c.birth_date).toLocaleDateString('pt-BR') : '',
      Status: c.is_active ? 'Ativo' : 'Inativo',
      'Total Agendamentos': c._count.appointments,
      'Cadastrado em': new Date(c.created_at).toLocaleDateString('pt-BR'),
    }))
    csv = toCSV(data)
    filename = 'clientes'
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
