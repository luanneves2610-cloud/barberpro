import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { PerfilClient } from './perfil-client'

export const metadata: Metadata = { title: 'Meu Perfil' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Meu Perfil" description="Atualize seus dados pessoais e senha" />
      <PerfilClient
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone ?? '',
          role: profile.role,
          avatar_url: profile.avatar_url ?? null,
        }}
      />
    </div>
  )
}
