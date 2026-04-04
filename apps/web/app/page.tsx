import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberpro.com.br'

export const metadata: Metadata = {
  title: 'BarberPro — Sistema de Gestão para Barbearias',
  description:
    'Gerencie agendamentos, comissões, financeiro e marketing da sua barbearia em um só lugar. Experimente grátis por 14 dias.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: 'BarberPro — Sistema de Gestão para Barbearias',
    description:
      'Gerencie agendamentos, comissões, financeiro e marketing da sua barbearia em um só lugar. Experimente grátis por 14 dias.',
    siteName: 'BarberPro',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarberPro — Sistema de Gestão para Barbearias',
    description:
      'Gerencie agendamentos, comissões, financeiro e marketing da sua barbearia em um só lugar.',
  },
  alternates: {
    canonical: APP_URL,
  },
}

// ─── Ícones inline (sem dependência extra) ───────────────────────────────────
function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-400 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.826L.057 23.272a.75.75 0 00.921.921l5.444-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.49-5.187-1.349l-.372-.214-3.863 1.041 1.041-3.862-.214-.372A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

// ─── Dados estáticos ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <IconCalendar />,
    title: 'Agenda Inteligente',
    description:
      'Visualize todos os agendamentos em timeline. Crie recorrências, envie confirmação automática via WhatsApp e reduza faltas.',
  },
  {
    icon: <IconMoney />,
    title: 'Financeiro & Comissões',
    description:
      'Acompanhe o caixa do dia, controle receitas e despesas, calcule comissões por barbeiro e exporte relatórios em CSV.',
  },
  {
    icon: <IconWhatsApp />,
    title: 'Marketing via WhatsApp',
    description:
      'Envie mensagens em massa, lembretes de agendamento, felicitações de aniversário e campanhas de reengajamento automaticamente.',
  },
  {
    icon: <IconChart />,
    title: 'Relatórios & Metas',
    description:
      'Dashboard com KPIs em tempo real: faturamento, ticket médio, taxa de retorno e meta mensal com progresso visual.',
  },
]

const PLANS = [
  {
    name: 'BASIC',
    price: '97',
    description: 'Ideal para barbearias com até 2 profissionais',
    features: [
      'Até 2 barbeiros',
      '200 agendamentos/mês',
      'Agenda + Financeiro',
      'Relatórios básicos',
      'Suporte por e-mail',
    ],
    highlight: false,
    cta: 'Começar grátis',
  },
  {
    name: 'PRO',
    price: '197',
    description: 'Para barbearias em crescimento',
    features: [
      'Barbeiros ilimitados',
      'Agendamentos ilimitados',
      'Marketing via WhatsApp',
      'Comissões automáticas',
      'Importação de clientes (CSV)',
      'Suporte prioritário',
    ],
    highlight: true,
    cta: 'Começar grátis',
  },
  {
    name: 'ENTERPRISE',
    price: '397',
    description: 'Para redes e franquias',
    features: [
      'Tudo do PRO',
      'NF-e automática',
      'Multi-unidades',
      'Webhooks & API',
      'Onboarding dedicado',
      'SLA garantido',
    ],
    highlight: false,
    cta: 'Falar com vendas',
  },
]

const TESTIMONIALS = [
  {
    name: 'Ricardo Moura',
    role: 'Dono — Barbearia do Rico, SP',
    text: 'Antes eu perdia hora anotando agendamento no caderno. Hoje tudo é automático: confirmação, lembrete, comissão. Faturei 40% a mais no primeiro trimestre.',
  },
  {
    name: 'Fernanda Lopes',
    role: 'Gerente — Studio FX, RJ',
    text: 'O WhatsApp automático mudou tudo. A taxa de faltas caiu de 25% para menos de 5% em 2 meses. Vale muito o investimento.',
  },
  {
    name: 'Carlos Henrique',
    role: 'Barbeiro & Empreendedor, MG',
    text: 'Consigo ver o caixa do dia, as comissões de cada barbeiro e ainda emito NF-e pelo próprio sistema. Simplesmente completo.',
  },
]

// ─── Componentes de seção ─────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm leading-none">B</span>
          </div>
          <span className="font-bold text-lg tracking-tight">BarberPro</span>
        </div>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#funcionalidades" className="hover:text-zinc-100 transition-colors">Funcionalidades</a>
          <a href="#precos" className="hover:text-zinc-100 transition-colors">Preços</a>
          <a href="#depoimentos" className="hover:text-zinc-100 transition-colors">Depoimentos</a>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Teste grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Sistema completo para barbearias
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Gerencie sua barbearia{' '}
          <span className="text-amber-400">do jeito certo</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Agendamentos, financeiro, comissões e marketing via WhatsApp — tudo em
          um painel simples e poderoso. Comece grátis por 14 dias, sem cartão.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-amber-500/20"
          >
            Começar gratuitamente
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <a
            href="#funcionalidades"
            className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 font-medium px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Ver funcionalidades
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
          <div className="flex -space-x-2">
            {['R', 'F', 'C', 'M', 'A'].map((l, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-950 flex items-center justify-center text-xs font-bold text-zinc-300"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => <IconStar key={i} />)}
            <span className="ml-1">
              <strong className="text-zinc-300">4,9</strong> — mais de 500 barbearias ativas
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="funcionalidades" className="py-24 px-4 sm:px-6 bg-zinc-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tudo que sua barbearia precisa
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Do agendamento ao financeiro, passando pelo marketing — um sistema completo
            pensado para a rotina real do barbeiro.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="py-16 px-4 sm:px-6 border-y border-zinc-800">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: '500+', label: 'Barbearias ativas' },
          { value: '98%', label: 'Taxa de satisfação' },
          { value: '40%', label: 'Aumento médio de receita' },
          { value: '5×', label: 'Redução de faltas' },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mb-1">{s.value}</div>
            <div className="text-sm text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="precos" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos e preços</h2>
          <p className="text-zinc-400">Comece com 14 dias grátis. Cancele quando quiser.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border ${
                plan.highlight
                  ? 'bg-amber-500/5 border-amber-500/40 shadow-xl shadow-amber-500/10'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="mb-5">
                <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  {plan.name}
                </span>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-sm text-zinc-500 mb-1">R$</span>
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-zinc-500 mb-1">/mês</span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-zinc-300">
                    <IconCheck />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors ${
                  plan.highlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    : 'border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section id="depoimentos" className="py-24 px-4 sm:px-6 bg-zinc-900/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-zinc-400">Barbearias reais. Resultados reais.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => <IconStar key={i} />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div>
                <div className="font-semibold text-zinc-100 text-sm">{t.name}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 rounded-3xl p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para transformar sua barbearia?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Junte-se a mais de 500 barbearias que já usam o BarberPro. Comece
            grátis — sem cartão, sem burocracia.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-10 py-4 rounded-xl transition-colors text-base shadow-lg shadow-amber-500/20"
          >
            Criar conta grátis
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <p className="text-zinc-600 text-xs mt-4">14 dias grátis • Cancele a qualquer momento</p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xs">B</span>
          </div>
          <span className="font-bold text-sm">BarberPro</span>
        </div>
        <p className="text-zinc-600 text-sm">
          © {new Date().getFullYear()} BarberPro. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <a href="#" className="hover:text-zinc-400 transition-colors">Termos</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacidade</a>
          <Link href="/login" className="hover:text-zinc-400 transition-colors">Login</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
