import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { PageHeader } from '@/components/ui/page-header'
import { NotificacoesClient } from './notificacoes-client'

export const metadata: Metadata = { title: 'Notificações' }

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const filter = searchParams.filter ?? 'all'

  const where: Record<string, unknown> = { tenant_id: profile.tenant_id }
  if (filter === 'unread') where.is_read = false
  if (filter === 'read') where.is_read = true

  const [notificationsRaw, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    }),
    prisma.notification.count({
      where: { tenant_id: profile.tenant_id, is_read: false },
    }),
  ])

  const notifications = notificationsRaw.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type as string,
    is_read: n.is_read,
    created_at: n.created_at.toISOString(),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notificações"
        description="Central de notificações da barbearia"
      />
      <NotificacoesClient
        notifications={notifications}
        totalUnread={totalUnread}
        filter={filter}
      />
    </div>
  )
}
