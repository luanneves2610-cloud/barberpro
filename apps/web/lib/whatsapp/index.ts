/**
 * WhatsApp via Evolution API
 * Docs: https://doc.evolution-api.com
 *
 * Variáveis de ambiente necessárias:
 *   EVOLUTION_API_URL=https://sua-evolution.com
 *   EVOLUTION_API_KEY=sua_api_key
 *   EVOLUTION_INSTANCE=nome_da_instancia
 */

const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY || !EVOLUTION_INSTANCE) {
    // WhatsApp não configurado — silent skip
    return
  }

  try {
    const res = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: formatPhone(phone),
          text: message,
        }),
      },
    )

    if (!res.ok) {
      console.error('[WhatsApp] Falha ao enviar mensagem:', await res.text())
    }
  } catch (err) {
    console.error('[WhatsApp] Erro:', err)
  }
}

// Mensagens prontas

export function msgAgendamentoConfirmado(params: {
  clientName: string
  barberName: string
  serviceName: string
  date: string
  startTime: string
  tenantName: string
  confirmUrl?: string
  recurrenceCount?: number
}) {
  const recurrenceNote = params.recurrenceCount && params.recurrenceCount > 1
    ? `\n🔁 Agendamento recorrente: ${params.recurrenceCount}x no mesmo horário.`
    : ''
  const confirmNote = params.confirmUrl
    ? `\n\n✅ *Confirme sua presença:*\n${params.confirmUrl}`
    : ''
  return (
    `✂️ *${params.tenantName}* — Agendamento Confirmado!\n\n` +
    `Olá, *${params.clientName}*! Seu agendamento foi confirmado:\n\n` +
    `📋 Serviço: ${params.serviceName}\n` +
    `💈 Barbeiro: ${params.barberName}\n` +
    `📅 Data: ${params.date}\n` +
    `⏰ Horário: ${params.startTime}` +
    recurrenceNote +
    confirmNote +
    `\n\nAté lá! 😊`
  )
}

export function msgAgendamentoCancelado(params: {
  clientName: string
  date: string
  startTime: string
  tenantName: string
}) {
  return (
    `✂️ *${params.tenantName}*\n\n` +
    `Olá, *${params.clientName}*. Seu agendamento do dia *${params.date}* às *${params.startTime}* foi cancelado.\n\n` +
    `Para reagendar, entre em contato conosco. 😊`
  )
}

export function msgAniversario(params: {
  clientName: string
  tenantName: string
}) {
  return (
    `🎂 *${params.tenantName}*\n\n` +
    `Feliz aniversário, *${params.clientName}*! 🎉🥳\n\n` +
    `Toda a equipe deseja um dia especial cheio de alegria!\n\n` +
    `Como presente, entre em contato e ganhe uma condição especial no seu próximo corte. Fique bonito no seu dia! ✂️💈`
  )
}

export function msgReengajamento(params: {
  clientName: string
  tenantName: string
  diasSemVisita: number
}) {
  return (
    `✂️ *${params.tenantName}*\n\n` +
    `Olá, *${params.clientName}*! Sentimos sua falta! 👋\n\n` +
    `Faz ${params.diasSemVisita} dias desde sua última visita. Que tal dar aquela renovada?\n\n` +
    `Agende agora e volte a arrasar! 💈😎`
  )
}

export function msgServicoConcluidoComRecibo(params: {
  clientName: string
  serviceName: string
  price: number
  tenantName: string
  appointmentId?: string
  baseUrl?: string
}) {
  const priceStr = params.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const ratingLink = params.appointmentId && params.baseUrl
    ? `\n⭐ Avalie seu atendimento: ${params.baseUrl}/avaliar/${params.appointmentId}`
    : ''
  return (
    `✂️ *${params.tenantName}*\n\n` +
    `Obrigado pela visita, *${params.clientName}*! 🙏\n\n` +
    `✅ *${params.serviceName}* — ${priceStr}${ratingLink}\n\n` +
    `Nos vemos em breve! Se gostar, nos indique para os amigos 💈`
  )
}
