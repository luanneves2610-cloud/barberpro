import { createClient } from '@/lib/supabase/server'
import { prisma } from '@barberpro/database'
import { redirect } from 'next/navigation'
import {
  MessageSquare, CreditCard, FileText, Wifi,
  ExternalLink, CheckCircle2, AlertCircle, Info, QrCode,
} from 'lucide-react'
import { CopyButton } from './copy-button'

export default async function IntegracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({ where: { user_id: user.id } })
  if (!profile) redirect('/login')

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenant_id },
    select: { name: true, slug: true, plan: true },
  })

  // Check which integrations are configured (server-side env check)
  const integrations = {
    whatsapp: {
      configured: !!(
        process.env.EVOLUTION_API_URL &&
        process.env.EVOLUTION_API_KEY &&
        process.env.EVOLUTION_INSTANCE
      ),
      url: process.env.EVOLUTION_API_URL,
      instance: process.env.EVOLUTION_INSTANCE,
    },
    mercadopago: {
      configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    },
    nfe: {
      configured: !!process.env.FOCUS_NFE_TOKEN,
      env: process.env.FOCUS_NFE_ENV ?? 'homologacao',
    },
    redis: {
      configured: !!process.env.REDIS_URL,
      url: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:\/\/.*@/, '://***@') : null,
    },
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const bookingUrl = `${appUrl}/agendar/${tenant?.slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Integrações</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Status das integrações e links úteis da sua barbearia
        </p>
      </div>

      {/* Public booking link */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/15 p-2 shrink-0">
            <ExternalLink className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">Link de agendamento online</h2>
            <p className="text-xs text-zinc-400 mb-3">
              Compartilhe este link com seus clientes para agendamentos sem precisar ligar.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={bookingUrl}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none min-w-0"
              />
              <CopyButton text={bookingUrl} />
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Abrir
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-zinc-800 p-2 shrink-0">
            <QrCode className="h-5 w-5 text-zinc-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">QR Code para agendamento</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Imprima e cole em espelhos, cartões de visita ou na recepção. Clientes apontam a câmera e já agendam.
            </p>
            <div className="flex flex-wrap items-start gap-6">
              {/* QR code image via free API — no extra dependency */}
              <div className="rounded-xl border border-zinc-700 bg-white p-2 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(bookingUrl)}&bgcolor=ffffff&color=000000&margin=4`}
                  alt="QR Code de agendamento"
                  width={160}
                  height={160}
                  className="block rounded"
                />
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <p className="text-xs font-medium text-zinc-300">{tenant?.name}</p>
                <p className="text-xs text-zinc-500 font-mono break-all">{bookingUrl}</p>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(bookingUrl)}&bgcolor=ffffff&color=000000&margin=8`}
                  download={`qrcode-${tenant?.slug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors w-fit"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Baixar QR Code (512px)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* WhatsApp */}
        <IntegrationCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="WhatsApp (Evolution API)"
          description="Confirmações, lembretes e recibos automáticos via WhatsApp."
          configured={integrations.whatsapp.configured}
          details={integrations.whatsapp.configured ? [
            { label: 'Instância', value: integrations.whatsapp.instance ?? '—' },
            { label: 'URL', value: integrations.whatsapp.url ?? '—' },
          ] : []}
          docUrl="https://doc.evolution-api.com"
          docLabel="Documentação Evolution API"
          envVars={['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE']}
          features={[
            'Confirmação ao agendar',
            'Lembrete 1h antes',
            'Recibo após atendimento',
            'Link de avaliação',
            'Disparos em massa (Marketing)',
          ]}
        />

        {/* Mercado Pago */}
        <IntegrationCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Mercado Pago"
          description="Aceite pagamentos online e gerencie assinaturas do plano."
          configured={integrations.mercadopago.configured}
          details={[]}
          docUrl="https://www.mercadopago.com.br/developers"
          docLabel="Portal do Desenvolvedor"
          envVars={['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET']}
          features={[
            'Checkout Pro para upgrades de plano',
            'Webhook de pagamento aprovado',
            'Atualização automática do plano',
          ]}
          planRequired={tenant?.plan === 'BASIC' ? 'PRO' : undefined}
        />

        {/* NF-e */}
        <IntegrationCard
          icon={<FileText className="h-5 w-5" />}
          title="Focus NFe (NF-e)"
          description="Emissão automática de Nota Fiscal eletrônica por atendimento."
          configured={integrations.nfe.configured}
          details={integrations.nfe.configured ? [
            { label: 'Ambiente', value: integrations.nfe.env === 'producao' ? '🟢 Produção' : '🟡 Homologação' },
          ] : []}
          docUrl="https://focusnfe.com.br/docs"
          docLabel="Documentação Focus NFe"
          envVars={['FOCUS_NFE_TOKEN', 'FOCUS_NFE_ENV']}
          features={[
            'NF-e por agendamento concluído',
            'Emissão assíncrona via BullMQ',
            'Notificação ao emitir',
          ]}
          planRequired={tenant?.plan !== 'ENTERPRISE' ? 'ENTERPRISE' : undefined}
        />

        {/* Redis / BullMQ */}
        <IntegrationCard
          icon={<Wifi className="h-5 w-5" />}
          title="Redis (BullMQ)"
          description="Filas de tarefas: lembretes, disparos em massa e NF-e."
          configured={integrations.redis.configured}
          details={integrations.redis.configured ? [
            { label: 'URL', value: integrations.redis.url ?? '—' },
          ] : []}
          docUrl="https://docs.bullmq.io"
          docLabel="Documentação BullMQ"
          envVars={['REDIS_URL']}
          features={[
            'Lembretes automáticos de WhatsApp',
            'Disparos em massa com rate limiting',
            'Emissão assíncrona de NF-e',
          ]}
        />
      </div>

      {/* Setup guide */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-zinc-400 shrink-0" />
          <h2 className="text-sm font-semibold text-zinc-300">Como configurar</h2>
        </div>
        <ol className="space-y-2 text-sm text-zinc-400 list-none">
          {[
            'Edite o arquivo <code class="text-amber-400 text-xs">apps/web/.env.local</code> com as variáveis necessárias',
            'Use <code class="text-amber-400 text-xs">.env.example</code> como referência para ver todas as variáveis disponíveis',
            'Reinicie o servidor após alterar variáveis de ambiente',
            'Para produção (Vercel), configure as variáveis no painel do projeto em Settings → Environment Variables',
            'Para os workers BullMQ em produção, rode: <code class="text-amber-400 text-xs">npx tsx apps/web/lib/queue/workers.ts</code>',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-500">
                {i + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: step }} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

interface IntegrationCardProps {
  icon: React.ReactNode
  title: string
  description: string
  configured: boolean
  details: { label: string; value: string }[]
  docUrl: string
  docLabel: string
  envVars: string[]
  features: string[]
  planRequired?: string
}

function IntegrationCard({
  icon, title, description, configured, details,
  docUrl, docLabel, envVars, features, planRequired,
}: IntegrationCardProps) {
  return (
    <div className={[
      'rounded-xl border p-5 space-y-4',
      configured ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-800 bg-zinc-900',
    ].join(' ')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={[
            'rounded-lg p-2',
            configured ? 'bg-green-500/15 text-green-400' : 'bg-zinc-800 text-zinc-500',
          ].join(' ')}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
            {planRequired && (
              <span className="inline-block text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 mt-0.5">
                Plano {planRequired}+
              </span>
            )}
          </div>
        </div>
        <div className={[
          'flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
          configured
            ? 'bg-green-500/15 text-green-400'
            : 'bg-zinc-800 text-zinc-500',
        ].join(' ')}>
          {configured
            ? <><CheckCircle2 className="h-3 w-3" /> Conectado</>
            : <><AlertCircle className="h-3 w-3" /> Não configurado</>}
        </div>
      </div>

      <p className="text-xs text-zinc-400">{description}</p>

      {/* Details */}
      {details.length > 0 && (
        <div className="space-y-1">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between text-xs">
              <span className="text-zinc-500">{d.label}</span>
              <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[60%]">{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="space-y-1">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={configured ? 'text-green-500' : 'text-zinc-700'}>✓</span>
            {f}
          </div>
        ))}
      </div>

      {/* Env vars needed */}
      {!configured && (
        <div className="rounded-lg bg-zinc-800/80 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            Variáveis necessárias
          </p>
          {envVars.map((v) => (
            <p key={v} className="font-mono text-[11px] text-amber-400">{v}</p>
          ))}
        </div>
      )}

      {/* Doc link */}
      <a
        href={docUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        {docLabel}
      </a>
    </div>
  )
}
