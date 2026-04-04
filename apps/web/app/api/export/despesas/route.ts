import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@barberpro/database'
import { checkExportRateLimit } from '@/lib/export-rate-limit'

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '\uFEFF'
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = row[h]
          const str = v === null || v === undefined ? '' : String(v)
          return str.includes(';') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(';'),
    ),
  ]
  return '\uFEFF' + lines.join('\r\n')
}

export async function GET(req: NextRequest) {
  const auth = await checkExportRateLimit(req)
  if (auth instanceof NextResponse) return auth
  const { tenantId } = auth

  const { searchParams } = req.nextUrl
  const now = new Date()
  const year = Number(searchParams.get('year') ?? now.getFullYear())
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const expenses = await prisma.expense.findMany({
    where: {
      tenant_id: tenantId,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: [{ category: 'asc' }, { date: 'asc' }],
  })

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const data: Record<string, unknown>[] = [
    ...expenses.map((e) => ({
      Data: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      Categoria: e.category,
      Descrição: e.description,
      'Valor (R$)': Number(e.amount).toFixed(2).replace('.', ','),
    })),
    { Data: '', Categoria: '', Descrição: 'TOTAL', 'Valor (R$)': total.toFixed(2).replace('.', ',') },
  ]

  const MONTH_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const filename = `despesas_${MONTH_NAMES[month - 1]}${year}`

  return new NextResponse(toCSV(data), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
