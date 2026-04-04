'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prisma } from '@barberpro/database'
import type { RegisterTenantPayload, LoginPayload } from '@barberpro/types'

// Cliente admin com service role — bypassa RLS e permite deleteUser
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ============================================================
// REGISTRO DE NOVO TENANT (owner)
// ============================================================

export async function registerTenant(payload: RegisterTenantPayload) {
  const supabase = await createClient()

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { name: payload.ownerName },
    },
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Erro ao criar usuário' }
  }

  const userId = authData.user.id

  try {
    // 2. Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: payload.tenantName,
        slug: payload.slug,
        phone: payload.phone ?? null,
        plan: payload.plan ?? 'BASIC',
        status: 'ACTIVE',
      },
    })

    // 3. Criar profile do owner
    await prisma.profile.create({
      data: {
        tenant_id: tenant.id,
        user_id: userId,
        role: 'OWNER',
        name: payload.ownerName,
        email: payload.email,
        phone: payload.phone ?? null,
      },
    })

    // 4. Criar subscription trial (7 dias)
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    await prisma.subscription.create({
      data: {
        tenant_id: tenant.id,
        plan: payload.plan ?? 'BASIC',
        status: 'TRIALING',
        price: payload.plan === 'PRO' ? 197 : payload.plan === 'ENTERPRISE' ? 397 : 97,
        trial_ends_at: trialEnd,
      },
    })
  } catch (dbError: unknown) {
    const msg = dbError instanceof Error ? dbError.message : String(dbError)
    console.error('[registerTenant] DB error:', msg)
    // Remove o usuário do Auth para não deixar órfão
    await getAdminClient().auth.admin.deleteUser(userId).catch(() => {})
    await supabase.auth.signOut()
    if (msg.includes('P2002') || msg.includes('unique')) {
      return { error: 'Este slug já está em uso. Escolha outro nome para a URL da barbearia.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================
// LOGIN
// ============================================================

export async function login(payload: LoginPayload) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error) {
    return { error: 'Email ou senha incorretos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// VERIFICAR SLUG DISPONÍVEL
// ============================================================

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  return !existing
}

// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    // Não revelamos se o e-mail existe ou não (segurança)
    console.error('[requestPasswordReset]', error.message)
  }

  // Sempre retorna sucesso (evita user enumeration)
  return { ok: true }
}

// ============================================================
// REDEFINIR SENHA (após clicar no link do e-mail)
// ============================================================

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: 'Não foi possível redefinir a senha. O link pode ter expirado.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
