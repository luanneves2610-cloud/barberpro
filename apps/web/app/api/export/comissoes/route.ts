import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

function toCSV(rows: string[][]): string {
  return '\uFEFF' + rows.map((r) => r.join(';')).join('\n')
}

export async function GET(request: NextRequest) {
  const auth = await checkExportRateLimit(request)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth

  const sp = request.nextUrl.searchParams
  const month = Number(sp.get('month') ?? new Date().getMonth() + 1)
  const year = Number(sp.get('year') ?? new Date().getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const appointments = await prisma.appointment.findMany({
    where: {
      tenant_id: tenantId,
      status: 'COMPLETED',
      date: { gte: startDate, lt: endDate },
    },
    include: {
      barber: { select: { name: true, commission_pct: true } },
      service: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: [{ barber: { name: 'asc' } }, { date: 'asc' }],
  })

  const rows: string[][] = [
    ['Barbeiro', 'Data', 'Cliente', 'Serviço', 'Valor (R$)', 'Comissão %', 'Comissão (R$)'],
  ]

  for (const a of appointments) {
    const price = Number(a.price)
    const pct = Number(a.barber.commission_pct)
    const commission = (price * pct) / 100
    rows.push([
      a.barber.name,
      a.date.toLocaleDateString('pt-BR'),
      a.client.name,
      a.service.name,
      price.toFixed(2).replace('.', ','),
      pct.toFixed(0),
      commission.toFixed(2).replace('.', ','),
    ])
  }

  const csv = toCSV(rows)
  const monthStr = String(month).padStart(2, '0')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="comissoes_${year}_${monthStr}.csv"`,
    },
  })
}
