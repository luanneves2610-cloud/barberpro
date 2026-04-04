'use server'

import { prisma } from '@barberpro/database'
import { createClient } from '@/lib/supabase/server'
import { emitirNFe } from '@/lib/nfe'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) throw new Error('Perfil não encontrado')
  return profile.tenant_id
}

/**
 * Emite NF-e para um agendamento concluído.
 * Requer que o tenant tenha CNPJ configurado nas configurações.
 */
export async function emitirNFeAgendamento(appointmentId: string) {
  const tenantId = await getTenantId()

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, tenant_id: tenantId },
    include: { client: true, service: true, tenant: true },
  })

  if (!appointment) throw new Error('Agendamento não encontrado')
  if (appointment.status !== 'COMPLETED') throw new Error('Somente agendamentos concluídos podem gerar NF-e')

  const tenant = appointment.tenant

  // Validações básicas
  if (!tenant.address || !tenant.city || !tenant.state) {
    throw new Error('Configure o endereço da barbearia antes de emitir NF-e (Configurações → Barbearia)')
  }

  const ref = `appt-${appointmentId}`

  const result = await emitirNFe({
    ref,
    naturezaOperacao: 'Prestação de Serviços',
    dataEmissao: new Date().toISOString(),
    cnpjEmitente: (tenant as unknown as { cnpj?: string }).cnpj ?? '',
    ieEmitente: 'ISENTO',
    razaoSocialEmitente: tenant.name,
    municipioEmitente: tenant.city,
    ufEmitente: tenant.state,
    cepEmitente: (tenant as unknown as { cep?: string }).cep ?? '00000-000',
    logradouroEmitente: tenant.address,
    numeroEmitente: 'S/N',
    indicadorIeDestinatario: 9,
    nomeDestinatario: appointment.client.name,
    itens: [
      {
        numero: '1',
        codigo: appointment.service_id,
        descricao: appointment.service.name,
        ncm: '93040000',
        cfop: '5102',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: Number(appointment.price),
        valorTotal: Number(appointment.price),
      },
    ],
  })

  // Cria notificação de sucesso
  const profile = await prisma.profile.findFirst({
    where: { tenant_id: tenantId, role: 'OWNER' },
  })
  if (profile) {
    await prisma.notification.create({
      data: {
        tenant_id: tenantId,
        profile_id: profile.id,
        title: 'NF-e emitida com sucesso',
        body: `NF-e referente ao serviço "${appointment.service.name}" foi emitida. Status: ${result.status}`,
        type: 'SYSTEM',
      },
    })
  }

  return result
}
