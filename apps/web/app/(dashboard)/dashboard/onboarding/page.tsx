import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const [barberCount, serviceCount, tenant] = await Promise.all([
    prisma.barber.count({ where: { tenant_id: profile.tenant_id } }),
    prisma.service.count({ where: { tenant_id: profile.tenant_id } }),
    prisma.tenant.findUnique({
      where: { id: profile.tenant_id },
      select: { name: true, slug: true, phone: true, address: true, plan: true },
    }),
  ])

  // If already set up, redirect to dashboard
  if (barberCount > 0 && serviceCount > 0) redirect('/dashboard')

  return (
    <OnboardingClient
      tenantSlug={tenant?.slug ?? ''}
      hasBarber={barberCount > 0}
      hasService={serviceCount > 0}
      tenantName={tenant?.name ?? ''}
    />
  )
}
