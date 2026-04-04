import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import type { Profile, Tenant } from '@barberpro/types'
import { headers } from 'next/headers'

function serializeProfile(p: NonNullable<Awaited<ReturnType<typeof getProfile>>>): Profile {
  return {
    ...p,
    phone: p.phone ?? null,
    avatar_url: p.avatar_url ?? null,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }
}

function serializeTenant(t: NonNullable<Awaited<ReturnType<typeof getProfile>>>['tenant']): Tenant {
  return {
    ...t,
    logo_url: t.logo_url ?? null,
    phone: t.phone ?? null,
    address: t.address ?? null,
    city: t.city ?? null,
    state: t.state ?? null,
    monthly_goal: t.monthly_goal ? Number(t.monthly_goal) : null,
    created_at: t.created_at.toISOString(),
    updated_at: t.updated_at.toISOString(),
  }
}

async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { user_id: userId },
    include: { tenant: true },
  })
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileData = await getProfile(user.id)
  if (!profileData) {
    const supabase2 = await createClient()
    await supabase2.auth.signOut()
    redirect('/login')
  }

  // Redirect novos tenants para onboarding (exceto na própria página)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (!pathname.includes('/onboarding')) {
    const [barberCount, serviceCount] = await Promise.all([
      prisma.barber.count({ where: { tenant_id: profileData.tenant_id } }),
      prisma.service.count({ where: { tenant_id: profileData.tenant_id } }),
    ])
    if (barberCount === 0 && serviceCount === 0) {
      redirect('/dashboard/onboarding')
    }
  }

  const profile = serializeProfile(profileData)
  const tenant = serializeTenant(profileData.tenant)

  const notificationsRaw = await prisma.notification.findMany({
    where: { tenant_id: profileData.tenant_id },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  const notifications = notificationsRaw.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type as string,
    is_read: n.is_read,
    created_at: n.created_at.toISOString(),
  }))

  return (
    <DashboardShell profile={profile} tenant={tenant} notifications={notifications}>
      {children}
    </DashboardShell>
  )
}
