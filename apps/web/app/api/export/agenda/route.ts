/**
 * GET /api/export/agenda?date=YYYY-MM-DD&month=MM&year=YYYY&range=dia|mes|semana
 *
 * Exporta agendamentos em CSV.
 * - range=dia  → apenas a data especificada em `date`
 * - range=mes  → todos os agendamentos do mês (month + year)
 * - range=semana → 7 dias a partir de `date`
 *
 * Rate limit: 30 exports / usuário / 10 min (via checkExportRateLimit).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
}

function escapeCSV(v: unknown): string {
  const str = v === null || v === undefined ? '' : String(v)
  return str.includes(';') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

export async function GET(req: NextRequest) {
  const auth = await checkExportRateLimit(req)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth

  const sp = req.nextUrl.searchParams
  const range = sp.get('range') ?? 'dia'
  const now = new Date()

  let start: Date
  let end: Date
  let filenameSuffix: string

  if (range === 'mes') {
    const year = Number(sp.get('year') ?? now.getFullYear())
    const month = Number(sp.get('month') ?? now.getMonth() + 1)
    start = new Date(year, month - 1, 1)
    end = new Date(year, month, 1)
    const monthStr = String(month).padStart(2, '0')
    filenameSuffix = `${year}-${monthStr}`
  } else if (range === 'semana') {
    const dateParam = sp.get('date')
    start = dateParam ? new Date(dateParam + 'T00:00:00') : new Date(now.toDateString())
    end = new Date(start)
    end.setDate(end.getDate() + 7)
    filenameSuffix = `semana-${start.toISOString().slice(0, 10)}`
  } else {
    // dia (padrão)
    const dateParam = sp.get('date')
    start = dateParam ? new Date(dateParam + 'T00:00:00') : new Date(now.toDateString())
    end = new Date(start)
    end.setDate(end.getDate() + 1)
    filenameSuffix = start.toISOString().slice(0, 10)
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      tenant_id: tenantId,
      date: { gte: start, lt: end },
    },
    include: {
      client: { select: { name: true, phone: true } },
      barber: { select: { name: true } },
      service: { select: { name: true } },
    },
    orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
  })

  const headers = [
    'Data',
    'Horário',
    'Cliente',
    'Telefone',
    'Barbeiro',
    'Serviço',
    'Status',
    'Pagamento',
    'Avaliação',
    'Confirmado',
    'Recorrência',
    'Valor (R$)',
  ]

  const rows = appointments.map((a) => [
    new Date(a.date).toLocaleDateString('pt-BR'),
    `${a.start_time}–${a.end_time}`,
    a.client.name,
    a.client.phone ?? '',
    a.barber.name,
    a.service.name,
    STATUS_LABELS[a.status] ?? a.status,
    a.payment_method ? (PAYMENT_LABELS[a.payment_method] ?? a.payment_method) : '',
    a.rating != null ? String(a.rating) : '',
    a.confirmed_at ? new Date(a.confirmed_at).toLocaleDateString('pt-BR') : '',
    a.recurrence_group_id ? 'Sim' : '',
    a.status === 'COMPLETED' ? Number(a.price).toFixed(2).replace('.', ',') : '',
  ])

  const lines = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(';'))
    .join('\r\n')

  const csv = '\uFEFF' + lines

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="agenda_${filenameSuffix}.csv"`,
    },
  })
}
