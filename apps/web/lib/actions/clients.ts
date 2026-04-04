'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

const ClientSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
})

export async function createClientRecord(formData: FormData) {
  const tenantId = await getTenantId()
  const data = ClientSchema.parse(Object.fromEntries(formData))

  await prisma.client.create({
    data: {
      tenant_id: tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      birth_date: data.birth_date ? new Date(data.birth_date) : null,
      notes: data.notes || null,
    },
  })
  revalidatePath('/dashboard/clientes')
}

export async function updateClientRecord(id: string, formData: FormData) {
  const tenantId = await getTenantId()
  const data = ClientSchema.parse(Object.fromEntries(formData))

  await prisma.client.update({
    where: { id, tenant_id: tenantId },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      birth_date: data.birth_date ? new Date(data.birth_date) : null,
      notes: data.notes || null,
    },
  })
  revalidatePath('/dashboard/clientes')
  revalidatePath(`/dashboard/clientes/${id}`)
}

export async function toggleClientStatus(id: string) {
  const tenantId = await getTenantId()
  const client = await prisma.client.findUnique({ where: { id, tenant_id: tenantId } })
  if (!client) throw new Error('Cliente não encontrado')

  await prisma.client.update({
    where: { id },
    data: { is_active: !client.is_active },
  })
  revalidatePath('/dashboard/clientes')
  revalidatePath(`/dashboard/clientes/${id}`)
}

export async function updateClientNotes(id: string, notes: string) {
  const tenantId = await getTenantId()
  await prisma.client.update({
    where: { id, tenant_id: tenantId },
    data: { notes: notes.trim() || null },
  })
  revalidatePath(`/dashboard/clientes/${id}`)
}

// ── Importação CSV ────────────────────────────────────────────────────────

interface ImportRow {
  name: string
  phone?: string
  email?: string
  birth_date?: string // YYYY-MM-DD ou DD/MM/YYYY
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number)
    return new Date(y, m - 1, d)
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'T12:00:00')
  }
  return null
}

export async function importClients(
  rows: ImportRow[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const tenantId = await getTenantId()

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowLabel = `Linha ${i + 2}` // +2 because row 1 is header

    if (!row.name?.trim()) {
      errors.push(`${rowLabel}: nome em branco — ignorado`)
      skipped++
      continue
    }

    try {
      // Skip if phone already exists for this tenant
      if (row.phone?.trim()) {
        const exists = await prisma.client.findFirst({
          where: { tenant_id: tenantId, phone: row.phone.trim() },
        })
        if (exists) {
          skipped++
          continue
        }
      }

      await prisma.client.create({
        data: {
          tenant_id: tenantId,
          name: row.name.trim(),
          phone: row.phone?.trim() || null,
          email: row.email?.trim() || null,
          birth_date: row.birth_date ? parseDate(row.birth_date) : null,
        },
      })
      created++
    } catch {
      errors.push(`${rowLabel}: erro ao importar "${row.name}"`)
      skipped++
    }
  }

  revalidatePath('/dashboard/clientes')
  return { created, skipped, errors }
}
