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

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
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

  const transactions = await prisma.transaction.findMany({
    where: {
      tenant_id: tenantId,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: 'asc' },
  })

  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

  const data: Record<string, unknown>[] = [
    ...transactions.map((t) => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: t.category ?? '',
      Descrição: t.description ?? '',
      'Forma Pagamento': t.payment_method ? (PAYMENT_LABELS[t.payment_method] ?? t.payment_method) : '',
      'Valor (R$)': `${t.type === 'INCOME' ? '' : '-'}${Number(t.amount).toFixed(2).replace('.', ',')}`,
    })),
    // Totals row
    { Data: '', Tipo: '', Categoria: '', Descrição: '', 'Forma Pagamento': 'TOTAL RECEITAS', 'Valor (R$)': income.toFixed(2).replace('.', ',') },
    { Data: '', Tipo: '', Categoria: '', Descrição: '', 'Forma Pagamento': 'TOTAL DESPESAS', 'Valor (R$)': expense.toFixed(2).replace('.', ',') },
    { Data: '', Tipo: '', Categoria: '', Descrição: '', 'Forma Pagamento': 'LUCRO LÍQUIDO', 'Valor (R$)': (income - expense).toFixed(2).replace('.', ',') },
  ]

  const MONTH_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const filename = `financeiro_${MONTH_NAMES[month - 1]}${year}`

  return new NextResponse(toCSV(data), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
