import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CASH: 'Dinheiro', CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito', PENDING: 'Pendente',
}
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído', SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento', CANCELLED: 'Cancelado',
}

export async function GET(req: NextRequest) {
  const auth = await checkExportRateLimit(req)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth
  const dateParam = req.nextUrl.searchParams.get('date')

  const selectedDate = dateParam
    ? new Date(dateParam + 'T00:00:00')
    : new Date(new Date().toDateString())

  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + 1)

  const appointments = await prisma.appointment.findMany({
    where: { tenant_id: tenantId, date: { gte: selectedDate, lt: nextDate } },
    include: {
      barber: { select: { name: true, commission_pct: true } },
      service: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: [{ start_time: 'asc' }],
  })

  const sep = ';'
  const rows: string[] = []
  rows.push('\uFEFF') // BOM
  rows.push(['Horário', 'Cliente', 'Serviço', 'Barbeiro', 'Valor (R$)', 'Pagamento', 'Comissão (R$)', 'Status'].join(sep))

  let totalRevenue = 0
  let totalCommission = 0

  for (const a of appointments) {
    const price = Number(a.price)
    const pct = Number(a.barber.commission_pct)
    const commission = a.status === 'COMPLETED' ? (price * pct) / 100 : 0
    if (a.status === 'COMPLETED') {
      totalRevenue += price
      totalCommission += commission
    }

    rows.push([
      `${a.start_time}–${a.end_time}`,
      a.client.name,
      a.service.name,
      a.barber.name,
      a.status === 'COMPLETED' ? price.toFixed(2).replace('.', ',') : '',
      a.payment_method ? (PAYMENT_LABELS[a.payment_method] ?? a.payment_method) : '',
      a.status === 'COMPLETED' ? commission.toFixed(2).replace('.', ',') : '',
      STATUS_LABELS[a.status] ?? a.status,
    ].join(sep))
  }

  rows.push('')
  rows.push(['TOTAL FATURADO', '', '', '', totalRevenue.toFixed(2).replace('.', ','), '', '', ''].join(sep))
  rows.push(['TOTAL COMISSÕES', '', '', '', totalCommission.toFixed(2).replace('.', ','), '', '', ''].join(sep))
  rows.push(['LÍQUIDO BARBEARIA', '', '', '', (totalRevenue - totalCommission).toFixed(2).replace('.', ','), '', '', ''].join(sep))

  const dateStr = selectedDate.toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `caixa_${dateStr}.csv`

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
